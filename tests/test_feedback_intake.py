import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "tools" / "feedback_intake.py"
SPEC = importlib.util.spec_from_file_location("feedback_intake_candidate", MODULE)
intake = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(intake)
MEASUREMENTS = []


def observation(stable="F-1"):
    return {"id": stable,
        "sources": [{"actor": "/reviewer", "role": "independent_critic"}],
        "evidence": [{"class": "expert_hypothesis", "locator": "Synthetic review, paragraph 1"}],
        "claim": {"fact": "A review raised a concern.", "inference": "Its impact has not been measured.",
                  "proposal": "Check a bounded scenario before implementation."},
        "priority": {"level": "P1", "reason": "A reproducible behavior needs examination."},
        "scope": {"behavior": "Synthetic local feedback processing only.", "files": ["web/app.js"]},
        "metric": {"unit": "defined scenarios", "denominator": "Three prespecified trajectories",
                   "acceptance": "Three exact expected outcomes; no educational efficacy claim."},
        "status": "proposed", "decision": {"substantive_disagreements": []}, "resolution": None}


class FeedbackIntakeTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="sendero-feedback-")
        self.root = Path(self.temporary.name)
        (self.root / "qa-private").mkdir()
        self.store = "qa-private/feedback"
        self.instances = []

    def tearDown(self):
        MEASUREMENTS.append({"test": self.id().split(".")[-1],
            "logical_read_bytes": sum(instance.read_bytes for instance in self.instances),
            "logical_write_bytes": sum(instance.write_bytes for instance in self.instances)})
        self.temporary.cleanup()

    def instance(self, cls=None):
        value = (cls or intake.Intake)(self.root, self.store)
        self.instances.append(value)
        return value

    def source(self, entries=None, indent=None):
        document = {"schema": "sendero.feedback-intake-proposal.v1", "author": "/original-author",
                    "entries": entries if entries is not None else [observation()]}
        raw = (json.dumps(document, ensure_ascii=False, indent=indent) + "\n").encode("utf-8")
        (self.root / "qa-private" / "incoming.json").write_bytes(raw)
        return "qa-private/incoming.json", hashlib.sha256(raw).hexdigest(), raw

    def import_source(self, source):
        return self.instance().import_feedback(source[0], source[1], "/implementer-recording-feedback")

    def stored(self, path):
        return self.root / self.store / path

    def test_01_validation_is_read_only_and_preserves_evidence_class(self):
        source = self.source()
        package = self.instance().validate(source[0], source[1])
        self.assertEqual(package["ids"], ["F-1"])
        self.assertEqual(package["document"]["entries"][0]["evidence"][0]["class"], "expert_hypothesis")
        self.assertFalse(self.stored("head.json").exists())
        self.assertFalse((self.root / self.store).exists())

    def test_02_import_is_idempotent_and_retains_original_bytes_actor_and_hash(self):
        source = self.source(indent=2)
        first, second = self.import_source(source), self.import_source(source)
        self.assertEqual((first["imported"], second["imported"]), (1, 0))
        self.assertEqual((first["head"], second["head"]), (1, 1))
        self.assertEqual(self.stored(f"sources/{source[1]}.json").read_bytes(), source[2])
        revision = json.loads(self.stored("records/F-1/000001.json").read_text(encoding="utf-8"))
        self.assertEqual(revision["registered_by"], "/implementer-recording-feedback")
        self.assertEqual(revision["source"]["author"], "/original-author")
        self.assertEqual(revision["record"]["sources"][0]["actor"], "/reviewer")
        self.assertEqual(revision["evidence_classes"], ["expert_hypothesis"])
        self.assertEqual(revision["authority_effect"], "none")
        self.assertFalse(self.stored("records/F-1/000002.json").exists())

    def test_03_revision_appends_without_rewriting_observation_or_disagreement(self):
        original = observation()
        original["decision"]["substantive_disagreements"] = [{"actor": "/teacher", "position": "Do not equate speed with learning."}]
        first = self.source([original]); self.import_source(first)
        before = self.stored("records/F-1/000001.json").read_bytes()
        changed = copy.deepcopy(original)
        changed["status"] = "triaged"
        changed["decision"]["reason"] = "Reproduce the observation before selecting a change."
        second = self.source([changed]); result = self.import_source(second)
        self.assertEqual(result["head"], 2)
        self.assertEqual(self.stored("records/F-1/000001.json").read_bytes(), before)
        revision = json.loads(self.stored("records/F-1/000002.json").read_text(encoding="utf-8"))
        self.assertEqual(revision["previous_sha256"], hashlib.sha256(before).hexdigest())
        self.assertEqual(revision["record"]["decision"]["substantive_disagreements"], original["decision"]["substantive_disagreements"])
        self.assertEqual(self.stored(f"sources/{first[1]}.json").read_bytes(), first[2])

    def test_04_new_raw_serialization_is_retained_without_spurious_record_revision(self):
        first = self.source(indent=None); self.import_source(first)
        second = self.source(indent=2); result = self.import_source(second)
        self.assertNotEqual(first[1], second[1])
        self.assertEqual(result["imported"], 0); self.assertEqual(result["head"], 2)
        self.assertTrue(self.stored(f"sources/{second[1]}.json").exists())
        self.assertFalse(self.stored("records/F-1/000002.json").exists())
        self.assertEqual(self.instance().state()["records"]["F-1"]["revision"], 1)

    def test_05_selection_and_deferral_generate_only_a_nonexecutable_findings_fragment(self):
        selected = observation(); selected["status"] = "selected"; selected["decision"]["reason"] = "Already authorized bounded implementation."
        invalid = self.source([selected])
        with self.assertRaisesRegex(intake.IntakeError, "authorization"):
            self.instance().validate(invalid[0], invalid[1])
        selected["decision"]["authorization_refs"] = ["Existing user request, C5 bounded implementation"]
        deferred = observation("F-2"); deferred["status"] = "deferred"
        deferred["decision"].update(reason="A baseline is not available.", reconsideration="Reconsider after a valid baseline.")
        source = self.source([selected, deferred]); self.import_source(source)
        result = self.instance().propose(["F-1", "F-2"], "Next authorized bounded increment", "c5-findings")
        proposal = json.loads((self.root / result["proposal"]).read_text(encoding="utf-8"))
        self.assertEqual([finding["disposition"] for finding in proposal["findings"]], ["implement", "defer"])
        self.assertFalse(proposal["executable_plan"]); self.assertEqual(proposal["authority_effect"], "none")
        self.assertNotIn("changes", proposal); self.assertNotIn("allowlist", proposal); self.assertNotIn("review_receipts", proposal)
        self.assertFalse((self.root / "web").exists())
        same = self.instance().propose(["F-1", "F-2"], "Next authorized bounded increment", "c5-findings")
        self.assertEqual(same["sha256"], result["sha256"])

    def test_06_source_and_local_evidence_hash_mismatch_fail_before_import(self):
        source = self.source()
        with self.assertRaisesRegex(intake.IntakeError, "Source hash"):
            self.instance().import_feedback(source[0], "0" * 64, "/actor")
        evidence = self.root / "qa-private" / "observed.txt"; evidence.write_bytes(b"first revision")
        record = observation()
        record["evidence"] = [{"class": "document", "path": "qa-private/observed.txt", "locator": "whole file",
                               "sha256": hashlib.sha256(evidence.read_bytes()).hexdigest()}]
        source = self.source([record]); evidence.write_bytes(b"different revision")
        with self.assertRaisesRegex(intake.IntakeError, "evidence hash mismatch"):
            self.import_source(source)
        self.assertFalse(self.stored("head.json").exists())

    def test_07_traversal_windows_ads_absolute_paths_and_credentials_are_denied(self):
        for path in ["../outside.json", "qa-private/../../outside.json", "C:\\outside.json", "/outside.json",
                     "qa-private/x:alternate", "qa-private//x", "qa-private/.env", "qa-private/NUL.txt"]:
            with self.subTest(path=path), self.assertRaises(intake.IntakeError):
                self.instance().validate(path, "0" * 64)
        with self.assertRaises(intake.IntakeError):
            intake.Intake(self.root, "web/intake")
        record = observation(); record["scope"]["files"] = ["../AGENTS.md"]
        source = self.source([record])
        with self.assertRaises(intake.IntakeError): self.import_source(source)
        record = observation(); record["evidence"] = [{"class": "document", "url": "https://user:secret@example.org/file"}]
        source = self.source([record])
        with self.assertRaises(intake.IntakeError): self.import_source(source)

    def test_08_unknown_evidence_status_and_duplicate_ids_cannot_enter_the_store(self):
        cases = []
        unknown = observation(); unknown["evidence"][0]["class"] = "unclassified"; cases.append([unknown])
        invalid = observation(); invalid["status"] = "approved"; cases.append([invalid])
        cases.append([observation(), observation()]); cases.append([observation("F-1"), observation("f-1")])
        for records in cases:
            source = self.source(records)
            with self.assertRaises(intake.IntakeError): self.import_source(source)
        self.assertFalse(self.stored("head.json").exists())

    def test_09_altered_latest_revision_is_detected_without_overwriting_it(self):
        source = self.source(); self.import_source(source)
        revision = self.stored("records/F-1/000001.json"); revision.write_bytes(b"tampered")
        with self.assertRaisesRegex(intake.IntakeError, "revision hash mismatch"):
            self.import_source(source)
        with self.assertRaisesRegex(intake.IntakeError, "revision hash mismatch"):
            self.instance().propose(["F-1"], "Read-only proposal", "unchanged")
        self.assertEqual(revision.read_bytes(), b"tampered")

    def test_10_pending_commit_recovers_without_duplicate_revision(self):
        class BeforeHead(intake.Intake):
            def write(self, name, data, replace=False):
                if name.endswith("/head.json"):
                    raise OSError("Synthetic interruption before head publication")
                return super().write(name, data, replace)
        source = self.source()
        with self.assertRaisesRegex(OSError, "Synthetic interruption"):
            self.instance(BeforeHead).import_feedback(source[0], source[1], "/actor")
        self.assertFalse(self.stored("head.json").exists())
        self.assertTrue(self.stored("transactions/000001.json").exists())
        result = self.import_source(source)
        self.assertTrue(result["recovered"]); self.assertEqual(result["head"], 1)
        self.assertEqual(result["imported"], 0)
        self.assertFalse(self.stored("records/F-1/000002.json").exists())
        self.assertEqual(self.instance().state()["records"]["F-1"]["revision"], 1)

    def test_11_exclusive_lock_and_budget_preflight_prevent_new_payload_writes(self):
        source = self.source()
        self.stored("writer.lock").parent.mkdir(parents=True)
        self.stored("writer.lock").write_bytes(b"synthetic-lock")
        with self.assertRaisesRegex(intake.IntakeError, "Writer lock"):
            self.import_source(source)
        self.stored("writer.lock").unlink()
        with patch.object(intake, "MAX_WRITE", 256), self.assertRaisesRegex(intake.IntakeError, "budget"):
            self.import_source(source)
        self.assertFalse(self.stored("sources").exists()); self.assertFalse(self.stored("head.json").exists())
        with patch.object(intake, "MAX_READ", 64), self.assertRaisesRegex(intake.IntakeError, "budget"):
            self.instance().validate(source[0], source[1])

    def test_12_outcome_is_a_bound_claim_and_terminal_feedback_requires_reopening(self):
        artifact = self.root / "qa-private" / "artifact.txt"; artifact.write_bytes(b"bounded candidate")
        record = observation(); record["status"] = "resolved"
        record["resolution"] = {"artifacts": [{"path": "qa-private/artifact.txt", "sha256": hashlib.sha256(artifact.read_bytes()).hexdigest()}],
                                "limits": "A local functional claim, not educational effectiveness.", "evidence_refs": ["Independent review of this exact candidate"]}
        source = self.source([record]); self.import_source(source)
        result = self.instance().propose(["F-1"], "Review outcome claim", "resolved-claim")
        proposal = json.loads((self.root / result["proposal"]).read_text(encoding="utf-8"))
        self.assertEqual(proposal["findings"][0]["disposition"], "defer")
        self.assertEqual(proposal["authority_effect"], "none")
        changed = observation(); source = self.source([changed])
        with self.assertRaisesRegex(intake.IntakeError, "reopened"):
            self.import_source(source)
        changed["status"] = "reopened"; changed["decision"]["reason"] = "New evidence warrants another examination."
        source = self.source([changed]); self.assertEqual(self.import_source(source)["imported"], 1)

    def test_13_symlink_source_is_rejected_even_when_target_is_inside_root(self):
        source = self.source()
        link = self.root / "qa-private" / "linked.json"
        try:
            link.symlink_to(self.root / source[0])
        except (OSError, NotImplementedError) as error:
            self.skipTest(f"Symlink creation is unavailable in this environment: {type(error).__name__}")
        with self.assertRaisesRegex(intake.IntakeError, "Symlink|reparse"):
            self.instance().validate("qa-private/linked.json", source[1])

    def test_14_inconsistent_pending_transaction_cannot_promote_head_or_revisions(self):
        first = self.source([observation(), observation("F-OLD")]); self.import_source(first)
        head_before = self.stored("head.json").read_bytes()
        changed = observation(); changed["status"] = "triaged"; changed["decision"]["reason"] = "A bounded follow-up is needed."
        source = self.source([changed, observation("F-2")])
        class BeforeRevision(intake.Intake):
            def write(self, name, data, replace=False):
                if name.endswith("records/F-1/000002.json"):
                    raise OSError("Synthetic interruption before revision promotion")
                return super().write(name, data, replace)
        with self.assertRaisesRegex(OSError, "Synthetic interruption"):
            self.instance(BeforeRevision).import_feedback(source[0], source[1], "/actor")
        path = self.stored("transactions/000002.json")
        original = path.read_bytes(); transaction = json.loads(original)
        def corrupt_claim(value):
            value["revisions"][0]["record"]["claim"]["fact"] = "Content absent from the retained original."
        def drop_previous(value):
            del value["commit"]["records"]["F-OLD"]
        def change_parent(value):
            value["commit"]["parent_commit_sha256"] = "0" * 64
        def reduce_bytes(value):
            value["commit"]["stored_bytes"] = 0
        def change_locator(value):
            value["revisions"][0]["source"]["locator"] = "entries[99]"
        for mutate in [corrupt_claim, drop_previous, change_parent, reduce_bytes, change_locator]:
            with self.subTest(corruption=mutate.__name__):
                corrupt = copy.deepcopy(transaction); mutate(corrupt); path.write_bytes(intake.encode(corrupt))
                with self.assertRaisesRegex(intake.IntakeError, "Pending|pending"):
                    self.import_source(source)
                self.assertEqual(self.stored("head.json").read_bytes(), head_before)
                self.assertFalse(self.stored("records/F-1/000002.json").exists())
                self.assertFalse(self.stored("records/F-2/000001.json").exists())
        path.write_bytes(original)
        recovered = self.import_source(source)
        self.assertTrue(recovered["recovered"]); self.assertEqual(recovered["head"], 2)
        self.assertIn("F-OLD", self.instance().state()["records"])


if __name__ == "__main__":
    started = time.monotonic()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FeedbackIntakeTests))
    report = {"scope": "Small temporary fixtures, no network or product writes; interruption is simulated, not a physical crash",
        "tests_run": result.testsRun, "failures": len(result.failures), "errors": len(result.errors), "skipped": len(result.skipped),
        "elapsed_seconds": round(time.monotonic() - started, 3), "measurements": MEASUREMENTS,
        "io_scope": "Intake logical bytes only; excludes fixture creation, cleanup, filesystem metadata and other processes",
        "quota": "Recorded separately in quota ledger; local tests do not measure public quota"}
    if os.environ.get("FEEDBACK_METRICS_FILE"):
        Path(os.environ["FEEDBACK_METRICS_FILE"]).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    raise SystemExit(not result.wasSuccessful())
