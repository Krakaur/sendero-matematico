#!/usr/bin/env python3
"""Explicit, local feedback intake. Records observations; never applies a product change."""
import argparse
import hashlib
import json
import os
import re
import sys
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path, PureWindowsPath
from urllib.parse import urlparse

MAX_INPUT = 1024 * 1024
MAX_RECORD = 128 * 1024
MAX_READ = 8 * 1024 * 1024
MAX_WRITE = 4 * 1024 * 1024
MAX_STORED = 32 * 1024 * 1024
MAX_ENTRIES = 50
MAX_IDS = 200
MAX_PROPOSE = 20
MAX_STDOUT = 8192
STATES = {"proposed", "triaged", "selected", "implemented", "verified", "resolved", "deferred", "rejected", "reopened"}
EVIDENCE_CLASSES = {"code_observed", "execution", "ui_observed", "document", "expert_hypothesis"}
HEX = re.compile(r"[0-9a-f]{64}\Z")
STABLE_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}\Z")
RESERVED = {"con", "prn", "aux", "nul", *(f"com{i}" for i in range(1, 10)), *(f"lpt{i}" for i in range(1, 10))}


class IntakeError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise IntakeError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n").encode("utf-8")


def pairs(items):
    result = {}
    for key, value in items:
        require(key not in result, "Duplicate JSON object key")
        result[key] = value
    return result


def decode(raw):
    try:
        return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=pairs,
                          parse_constant=lambda _: (_ for _ in ()).throw(IntakeError("Non-finite JSON number")))
    except (UnicodeError, json.JSONDecodeError, RecursionError) as error:
        raise IntakeError("Invalid or excessively nested UTF-8 JSON") from error


def text(value, label, maximum=4000):
    require(isinstance(value, str) and value.strip() and len(value) <= maximum, f"Invalid {label}")
    return value


def identifier(value):
    require(isinstance(value, str) and STABLE_ID.fullmatch(value), "Invalid stable id")
    require(value.split(".")[0].casefold() not in RESERVED and not value.endswith("."), "Reserved stable id")
    return value


def relative(value):
    require(isinstance(value, str) and value and len(value) <= 500, "Invalid relative path")
    value = value.replace("\\", "/")
    require(not value.startswith("/") and not PureWindowsPath(value).drive, "Absolute paths are not permitted here")
    parts = value.split("/")
    require(all(part not in {"", ".", ".."} and ":" not in part and not part.endswith((" ", "."))
                and part.split(".")[0].casefold() not in RESERVED for part in parts), "Unsafe path component")
    require(not any(part.casefold() == ".git" or part.casefold().startswith(".env") for part in parts), "Private control or credential path denied")
    return "/".join(parts)


def reparse(path):
    if path.is_symlink():
        return True
    try:
        return bool(getattr(path.lstat(), "st_file_attributes", 0) & 0x400)
    except FileNotFoundError:
        return False


class Intake:
    def __init__(self, root, store):
        root = Path(root)
        require(root.is_dir() and not reparse(root), "Root must be an existing real directory")
        self.root = root.resolve(strict=True)
        self.store = relative(store)
        require(self.store.split("/")[0].casefold() == "qa-private" and "/" in self.store,
                "The intake store must be a dedicated child of qa-private")
        self.read_bytes = 0
        self.write_bytes = 0
        self.evidence_hashes = {}
        self.safe(self.store)

    def safe(self, name):
        normalized = relative(name)
        path = self.root
        for component in normalized.split("/"):
            path = path / component
            require(not reparse(path), "Symlink or reparse point denied")
        require(path.resolve(strict=False).is_relative_to(self.root), "Path escapes the declared root")
        return path

    def spath(self, name):
        return f"{self.store}/{relative(name)}"

    def read(self, name, maximum=MAX_INPUT):
        path = self.safe(name)
        require(path.is_file(), "Required input file is missing")
        size = path.stat().st_size
        require(size <= maximum and self.read_bytes + size <= MAX_READ, "Read budget exceeded")
        chunks, count = [], 0
        with path.open("rb") as handle:
            while True:
                chunk = handle.read(min(65536, maximum + 1 - count))
                if not chunk:
                    break
                count += len(chunk)
                self.read_bytes += len(chunk)
                require(count <= maximum and self.read_bytes <= MAX_READ, "Read budget exceeded during read")
                chunks.append(chunk)
        return b"".join(chunks)

    def write(self, name, data, replace=False):
        path = self.safe(name)
        if path.exists() and not replace:
            require(sha(self.read(name, MAX_WRITE)) == sha(data), "An immutable file already has different bytes")
            return
        require(self.write_bytes + len(data) <= MAX_WRITE, "Write budget exceeded")
        path.parent.mkdir(parents=True, exist_ok=True)
        self.safe(name)
        temporary = path.with_name(path.name + ".tmp-" + uuid.uuid4().hex)
        try:
            with temporary.open("xb") as handle:
                self.write_bytes += len(data)
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            self.safe(name)
            require(replace or not path.exists(), "Concurrent immutable file creation")
            os.replace(temporary, path)
        finally:
            if temporary.exists():
                temporary.unlink()

    @contextmanager
    def lock(self):
        path = self.safe(self.spath("writer.lock"))
        path.parent.mkdir(parents=True, exist_ok=True)
        self.safe(self.spath("writer.lock"))
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError as error:
            raise IntakeError("Writer lock exists; do not remove it until the prior process is known to have stopped") from error
        try:
            pid = str(os.getpid()).encode("ascii")
            with os.fdopen(fd, "wb") as handle:
                require(self.write_bytes + len(pid) <= MAX_WRITE, "Lock write budget exceeded")
                self.write_bytes += len(pid)
                handle.write(pid)
            yield
        finally:
            path.unlink(missing_ok=True)

    def local_evidence(self, evidence):
        if "path" in evidence:
            path = relative(evidence["path"])
            self.safe(path)
            expected = evidence.get("sha256")
            if expected is not None:
                require(isinstance(expected, str) and HEX.fullmatch(expected), "Invalid evidence SHA-256")
                if path not in self.evidence_hashes:
                    self.evidence_hashes[path] = sha(self.read(path))
                require(self.evidence_hashes[path] == expected, "Local evidence hash mismatch")
        if "url" in evidence:
            url = urlparse(text(evidence["url"], "evidence URL", 2000))
            require(url.scheme in {"https", "http"} and url.hostname and not url.username and not url.password,
                    "Only credential-free HTTP(S) evidence URLs are allowed; they are not fetched")

    def record(self, record):
        require(isinstance(record, dict), "Feedback entry must be an object")
        identifier(record.get("id"))
        required = {"sources", "evidence", "claim", "priority", "scope", "metric", "status", "decision", "resolution"}
        require(required.issubset(record), "Feedback entry is missing required fields")
        sources = record["sources"]
        require(isinstance(sources, list) and 1 <= len(sources) <= 20, "Feedback needs original actors")
        for source in sources:
            require(isinstance(source, dict), "Invalid source actor")
            text(source.get("actor"), "source actor", 200); text(source.get("role"), "source role", 100)
        evidence = record["evidence"]
        require(isinstance(evidence, list) and 1 <= len(evidence) <= 30, "Feedback needs classified evidence")
        for item in evidence:
            require(isinstance(item, dict) and item.get("class") in EVIDENCE_CLASSES, "Unknown evidence class")
            require(any(isinstance(item.get(key), str) and item[key].strip() for key in ["path", "url", "locator"]),
                    "Evidence needs a locator")
            self.local_evidence(item)
        claim = record["claim"]
        require(isinstance(claim, dict) and any(claim.get(key) for key in ["fact", "inference", "proposal"]), "Separate fact, inference and proposal")
        for value in claim.values():
            text(value, "claim", 12000)
        priority = record["priority"]
        require(isinstance(priority, dict) and priority.get("level") in {"P0", "P1", "P2"}, "Invalid priority")
        text(priority.get("reason"), "priority rationale")
        scope = record["scope"]
        require(isinstance(scope, dict), "Scope must be an object")
        text(scope.get("behavior"), "scoped behavior", 12000)
        for field in ["paths", "files"]:
            if field in scope:
                require(isinstance(scope[field], list) and len(scope[field]) <= 30, "Invalid proposed paths")
                for path in scope[field]:
                    self.safe(relative(path))
        metric = record["metric"]
        require(isinstance(metric, dict), "Metric or qualitative rubric required")
        text(metric.get("unit"), "metric unit"); text(metric.get("acceptance"), "acceptance or baseline condition", 12000)
        require(any(metric.get(key) for key in ["denominator", "denominators", "rubric"]), "Declare denominator or qualitative rubric")
        status = record["status"]
        require(status in STATES and isinstance(record["decision"], dict), "Invalid triage status or decision")
        decision = record["decision"]
        if status in {"triaged", "selected", "deferred", "rejected", "reopened"}:
            text(decision.get("reason") or decision.get("recommendation"), "decision rationale", 12000)
        if status in {"deferred", "rejected"}:
            text(decision.get("reconsideration"), "conditions for reconsideration")
        if status == "selected":
            refs = decision.get("authorization_refs")
            require(isinstance(refs, list) and 1 <= len(refs) <= 20, "Selection needs existing authorization references; intake grants none")
            for ref in refs:
                text(ref, "authorization reference", 2000)
        if status in {"implemented", "verified", "resolved"}:
            resolution = record["resolution"]
            require(isinstance(resolution, dict) and isinstance(resolution.get("artifacts"), list)
                    and 1 <= len(resolution["artifacts"]) <= 20, "Outcome claims need concrete artifact bindings")
            for artifact in resolution["artifacts"]:
                require(isinstance(artifact, dict) and "path" in artifact and "sha256" in artifact, "Artifact binding is incomplete")
                self.local_evidence(artifact)
            text(resolution.get("limits"), "remaining limits")
            if status in {"verified", "resolved"}:
                require(isinstance(resolution.get("evidence_refs"), list) and resolution["evidence_refs"], "Verification claim needs evidence references")
        require(len(encode(record)) <= MAX_RECORD, "Feedback record exceeds 128 KiB")
        return record

    def validate(self, source, expected):
        source = relative(source)
        require(isinstance(expected, str) and HEX.fullmatch(expected), "Expected source SHA-256 is required")
        raw = self.read(source)
        require(sha(raw) == expected, "Source hash mismatch")
        document = decode(raw)
        require(isinstance(document, dict) and document.get("schema") in
                {"sendero.feedback-intake-proposal.v1", "sendero.feedback.v1"}, "Unsupported feedback envelope")
        if "author" in document:
            text(document["author"], "original document author", 200)
        entries = document.get("entries")
        require(isinstance(entries, list) and 1 <= len(entries) <= MAX_ENTRIES, "A batch needs 1 to 50 feedback records")
        ids = [self.record(item)["id"] for item in entries]
        require(len(ids) == len(set(ids)) and len(ids) == len({item.casefold() for item in ids}), "Duplicate or case-colliding stable IDs")
        return {"source": source, "source_sha256": expected, "raw": raw, "document": document, "ids": ids}

    def state(self):
        head_path = self.spath("head.json")
        if not self.safe(head_path).exists():
            return {"number": 0, "records": {}, "commit_sha256": None, "stored_bytes": 0}
        head = decode(self.read(head_path, 2048))
        require(isinstance(head, dict) and isinstance(head.get("number"), int) and 1 <= head["number"] < 1000000,
                "Invalid intake head")
        raw = self.read(self.spath(f"commits/{head['number']:06d}.json"), 256 * 1024)
        require(sha(raw) == head.get("commit_sha256"), "Intake head/commit hash mismatch")
        commit = decode(raw)
        require(isinstance(commit, dict) and commit.get("schema") == "sendero.feedback-commit.v1"
                and commit.get("number") == head["number"] and isinstance(commit.get("records"), dict), "Invalid intake commit")
        require(len(commit["records"]) <= MAX_IDS and type(commit.get("stored_bytes")) is int
                and 0 <= commit["stored_bytes"] <= MAX_STORED, "Stored identity or byte budget exceeded")
        require(len({stable.casefold() for stable in commit["records"]}) == len(commit["records"]), "Case-colliding committed IDs")
        for stable, reference in commit["records"].items():
            identifier(stable)
            require(isinstance(reference, dict) and type(reference.get("revision")) is int
                    and 1 <= reference["revision"] < 1000000 and reference.get("status") in STATES,
                    "Invalid committed revision reference")
            require(all(isinstance(reference.get(field), str) and HEX.fullmatch(reference[field])
                        for field in ["sha256", "record_sha256"]), "Invalid committed hash reference")
        return {**commit, "commit_sha256": head["commit_sha256"]}

    def recover(self, state):
        name = self.spath(f"transactions/{state['number'] + 1:06d}.json")
        if not self.safe(name).exists():
            return state, False
        transaction_raw = self.read(name, 2 * MAX_INPUT)
        transaction = decode(transaction_raw)
        require(isinstance(transaction, dict) and transaction.get("schema") == "sendero.feedback-transaction.v1"
                and transaction.get("parent_commit_sha256") == state["commit_sha256"], "Pending transaction does not match current head")
        number = state["number"] + 1
        require(transaction.get("number") == number, "Invalid transaction number")
        source_hash = transaction.get("source_sha256")
        require(isinstance(source_hash, str) and HEX.fullmatch(source_hash), "Invalid pending source hash")
        source_raw = self.read(self.spath(f"sources/{source_hash}.json"))
        require(sha(source_raw) == source_hash, "Pending raw source hash mismatch")
        source = decode(source_raw)
        require(isinstance(source, dict) and source.get("schema") in
                {"sendero.feedback-intake-proposal.v1", "sendero.feedback.v1"}
                and isinstance(source.get("entries"), list) and 1 <= len(source["entries"]) <= MAX_ENTRIES,
                "Invalid retained source envelope")
        originals = {}
        for index, record in enumerate(source["entries"]):
            require(isinstance(record, dict), "Invalid retained source record")
            stable = identifier(record.get("id"))
            require(stable not in originals, "Duplicate retained source ID")
            originals[stable] = (index, record, sha(encode(record)))
        require(len({stable.casefold() for stable in originals}) == len(originals), "Case-colliding retained source IDs")
        revisions = transaction.get("revisions")
        require(isinstance(revisions, list) and len(revisions) <= MAX_ENTRIES, "Invalid pending revision list")
        commit = transaction.get("commit")
        require(isinstance(commit, dict) and commit.get("schema") == "sendero.feedback-commit.v1"
                and commit.get("number") == number and commit.get("parent_commit_sha256") == state["commit_sha256"]
                and commit.get("source_sha256") == source_hash and isinstance(commit.get("records"), dict)
                and len(commit["records"]) <= MAX_IDS, "Invalid pending commit or parent binding")
        actor = text(commit.get("registered_by"), "pending import actor", 200)
        expected_records = dict(state["records"])
        expected_changes = {stable for stable, (_, _, digest) in originals.items()
                            if stable not in expected_records or expected_records[stable]["record_sha256"] != digest}
        seen, writes = set(), []
        for revision in revisions:
            require(isinstance(revision, dict) and revision.get("schema") == "sendero.feedback-revision.v1", "Invalid pending revision")
            stable = identifier(revision.get("id"))
            require(stable in expected_changes and stable not in seen, "Unexpected or duplicate pending revision")
            seen.add(stable)
            index, original, record_hash = originals[stable]
            before = state["records"].get(stable)
            version = (before["revision"] if before else 0) + 1
            if before:
                prior = self.read(self.spath(f"records/{stable}/{before['revision']:06d}.json"), MAX_RECORD + 8192)
                require(sha(prior) == before["sha256"], "Pending revision refers to altered prior bytes")
            require(type(revision.get("revision")) is int and revision["revision"] == version
                    and revision.get("previous_sha256") == (before["sha256"] if before else None), "Pending revision chain mismatch")
            require(revision.get("record_sha256") == record_hash and sha(encode(revision.get("record"))) == record_hash,
                    "Pending revision record/source hash mismatch")
            binding = revision.get("source")
            require(isinstance(binding, dict) and binding.get("sha256") == source_hash
                    and binding.get("stored_path") == f"sources/{source_hash}.json"
                    and binding.get("locator") == f"entries[{index}]" and binding.get("author") == source.get("author"),
                    "Pending revision source binding mismatch")
            relative(binding.get("original_path"))
            require(revision.get("registered_by") == actor and revision.get("authority_effect") == "none"
                    and revision.get("evidence_classes") == sorted({item["class"] for item in original["evidence"]}),
                    "Pending revision actor or evidence binding mismatch")
            text(revision.get("registered_at"), "pending registration timestamp", 100)
            if before and before["status"] in {"resolved", "rejected"}:
                require(original["status"] == "reopened", "Pending terminal feedback was not reopened")
            raw = encode(revision)
            expected_records[stable] = {"revision": version, "sha256": sha(raw),
                                        "record_sha256": record_hash, "status": original["status"]}
            writes.append((self.spath(f"records/{stable}/{version:06d}.json"), raw))
        require(seen == expected_changes, "Pending transaction omits changed source records")
        require(commit["records"] == expected_records, "Pending commit does not preserve previous records and exact revision hashes")
        require(len({stable.casefold() for stable in expected_records}) == len(expected_records), "Case-colliding pending identity")
        # Historical integrity only: mutable evidence files are not re-read or claimed current during recovery.
        commit_raw = encode(commit)
        minimum_stored = state["stored_bytes"] + len(source_raw) + len(transaction_raw) + len(commit_raw) + sum(len(data) for _, data in writes) + 512
        require(type(commit.get("stored_bytes")) is int and minimum_stored <= commit["stored_bytes"] <= MAX_STORED,
                "Pending stored-byte accounting is inconsistent")
        writes.append((self.spath(f"commits/{number:06d}.json"), commit_raw))
        head = encode({"number": number, "commit_sha256": sha(commit_raw)})
        # Reserve all writes, including head, before promoting any revision. Repeated immutable writes are conservative.
        require(self.write_bytes + sum(len(data) for _, data in writes) + len(head) <= MAX_WRITE, "Recovery write budget exceeded")
        existing_reads = sum(self.safe(path).stat().st_size for path, _ in writes if self.safe(path).exists())
        require(self.read_bytes + 2 * existing_reads <= MAX_READ, "Recovery read budget exceeded before promotion")
        for path, data in writes:
            if self.safe(path).exists():
                require(sha(self.read(path, MAX_WRITE)) == sha(data), "An existing recovery target disagrees with the transaction")
        for path, data in writes:
            self.write(path, data)
        self.write(self.spath("head.json"), head, replace=True)
        return {**commit, "commit_sha256": sha(commit_raw)}, True

    def import_feedback(self, source, expected, actor):
        text(actor, "import actor", 200)
        package = self.validate(source, expected)
        with self.lock():
            current, recovered = self.recover(self.state())
            records = dict(current["records"])
            revisions, unchanged = [], []
            seen = {item.casefold(): item for item in records}
            for index, record in enumerate(package["document"]["entries"]):
                stable = record["id"]
                require(stable.casefold() not in seen or seen[stable.casefold()] == stable, "Case-colliding stored identity")
                before = records.get(stable)
                record_hash = sha(encode(record))
                if before:
                    previous_raw = self.read(self.spath(f"records/{stable}/{before['revision']:06d}.json"), MAX_RECORD + 8192)
                    require(sha(previous_raw) == before["sha256"], "Previous revision hash mismatch")
                if before and before["record_sha256"] == record_hash:
                    unchanged.append(stable)
                    continue
                if before and before["status"] in {"resolved", "rejected"}:
                    require(record["status"] == "reopened", "Resolved or rejected feedback must be explicitly reopened before revision")
                version = (before["revision"] if before else 0) + 1
                require(version < 1000000, "Revision budget exceeded")
                revision = {"schema": "sendero.feedback-revision.v1", "id": stable, "revision": version,
                    "previous_sha256": before["sha256"] if before else None,
                    "registered_by": actor, "registered_at": datetime.now(timezone.utc).isoformat(),
                    "source": {"original_path": package["source"], "sha256": expected,
                        "stored_path": f"sources/{expected}.json", "locator": f"entries[{index}]",
                        "author": package["document"].get("author")},
                    "record_sha256": record_hash, "record": record, "authority_effect": "none",
                    "evidence_classes": sorted({item["class"] for item in record["evidence"]})}
                revision_hash = sha(encode(revision))
                records[stable] = {"revision": version, "sha256": revision_hash,
                    "record_sha256": record_hash, "status": record["status"]}
                revisions.append(revision)
            require(len(records) <= MAX_IDS, "Maximum of 200 stable identities per store")
            source_name = self.spath(f"sources/{expected}.json")
            if not revisions and self.safe(source_name).exists():
                require(sha(self.read(source_name)) == expected, "Retained raw source hash mismatch")
                return {"imported": 0, "unchanged": unchanged, "head": current["number"], "recovered": recovered,
                        "source_sha256": expected, "raw_retained": True, "authority_effect": "none", **self.usage()}
            number = current["number"] + 1
            commit = {"schema": "sendero.feedback-commit.v1", "number": number,
                "parent_commit_sha256": current["commit_sha256"], "records": records,
                "source_sha256": expected, "registered_by": actor, "stored_bytes": current["stored_bytes"]}
            transaction = {"schema": "sendero.feedback-transaction.v1", "number": number,
                "parent_commit_sha256": current["commit_sha256"], "source_sha256": expected,
                "revisions": revisions, "commit": commit}
            # Conservative persistent-byte accounting includes the source again if it already exists.
            planned = len(package["raw"]) + len(encode(transaction)) + len(encode(commit)) + sum(len(encode(item)) for item in revisions) + 512
            commit["stored_bytes"] = current["stored_bytes"] + planned + 64
            transaction_raw = encode(transaction)
            planned = len(package["raw"]) + len(transaction_raw) + len(encode(commit)) + sum(len(encode(item)) for item in revisions) + 512
            require(planned + self.write_bytes <= MAX_WRITE, "Whole-import write budget exceeded before mutation")
            previous_read_reserve = sum(self.safe(self.spath(f"records/{item['id']}/{current['records'][item['id']]['revision']:06d}.json")).stat().st_size
                                        for item in revisions if item["id"] in current["records"])
            require(self.read_bytes + 2 * len(package["raw"]) + len(transaction_raw) + previous_read_reserve <= MAX_READ,
                    "Whole-import read budget exceeded before mutation")
            require(commit["stored_bytes"] <= MAX_STORED, "Store budget reached; create a separately reviewed archive")
            self.write(source_name, package["raw"])
            self.write(self.spath(f"transactions/{number:06d}.json"), transaction_raw)
            updated, _ = self.recover(current)
            return {"imported": len(revisions), "ids": [item["id"] for item in revisions], "unchanged": unchanged,
                    "head": updated["number"], "recovered": recovered, "authority_effect": "none", **self.usage()}

    def propose(self, ids, objective, name):
        require(isinstance(ids, list) and 1 <= len(ids) <= MAX_PROPOSE and len(ids) == len(set(ids)), "Select 1 to 20 unique IDs")
        text(objective, "proposal objective", 4000); identifier(name)
        state = self.state()
        require(not self.safe(self.spath(f"transactions/{state['number'] + 1:06d}.json")).exists(),
                "Pending import must be recovered by import before proposal")
        findings, bindings, metric_proposals, observations = [], [], [], []
        for stable in ids:
            identifier(stable)
            require(stable in state["records"], "Unknown selected stable id")
            reference = state["records"][stable]
            path = self.spath(f"records/{stable}/{reference['revision']:06d}.json")
            raw = self.read(path, MAX_RECORD + 8192)
            require(sha(raw) == reference["sha256"], "Feedback revision hash mismatch")
            revision = decode(raw)
            record = revision["record"]
            require(sha(encode(record)) == reference["record_sha256"], "Feedback content hash mismatch")
            selected = record["status"] == "selected"
            reason = record["decision"].get("reason") or record["decision"].get("recommendation") or "No seleccionado para esta implementación."
            findings.append({"id": stable, "disposition": "implement" if selected else "defer",
                             "reason": reason, "feedback_revision": reference["revision"], "feedback_sha256": reference["sha256"]})
            bindings.append({"id": stable, "revision": reference["revision"], "sha256": reference["sha256"],
                             "source_sha256": revision["source"]["sha256"], "status_claim": record["status"]})
            metric_proposals.append({"id": stable, "metric": record["metric"], "priority": record["priority"],
                                     "scope": record["scope"], "disagreements": record["decision"].get("substantive_disagreements", [])})
            observations.append({"id": stable, "claim": record["claim"], "sources": record["sources"],
                                 "evidence": record["evidence"], "evidence_status": "Recorded at intake; not refreshed by proposal"})
        proposal = {"schema": "sendero.findings-proposal.v1", "objective": objective, "findings": findings,
            "feedback_bindings": bindings, "metric_proposals": metric_proposals, "observations": observations,
            "authority_effect": "none", "executable_plan": False,
            "required_before_plan": ["Confirm current authorization and the existing campaign scope.",
                "Provide concrete candidate files, before/candidate hashes and reviewed artifacts.",
                "Declare measurable thresholds or a qualitative rubric before validation.",
                "Use the existing harness and independent reviewers; this file approves no receipt."],
            "head_commit_sha256": state["commit_sha256"]}
        output = encode(proposal)
        require(len(output) <= 256 * 1024, "Proposal output budget exceeded")
        # Serializing proposals shares the writer lock; the head is checked again before creation.
        with self.lock():
            require(self.state()["commit_sha256"] == state["commit_sha256"], "Feedback changed while preparing proposal")
            self.write(self.spath(f"proposals/{name}.json"), output)
        return {"proposal": f"{self.store}/proposals/{name}.json", "sha256": sha(output), "findings": len(findings),
                "executable_plan": False, "authority_effect": "none", **self.usage()}

    def usage(self):
        return {"logical_read_bytes": self.read_bytes, "logical_write_bytes": self.write_bytes,
                "limits": {"read": MAX_READ, "write": MAX_WRITE}, "physical_io_measured": False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True)
    parser.add_argument("--store", required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    for command in ["validate", "import"]:
        child = commands.add_parser(command)
        child.add_argument("--source", required=True)
        child.add_argument("--source-sha256", required=True)
        if command == "import":
            child.add_argument("--actor", required=True)
    proposal = commands.add_parser("propose")
    proposal.add_argument("--ids", required=True, nargs="+")
    proposal.add_argument("--objective", required=True)
    proposal.add_argument("--name", required=True)
    args = parser.parse_args(argv)
    try:
        intake = Intake(args.root, args.store)
        if args.command == "validate":
            package = intake.validate(args.source, args.source_sha256)
            result = {"valid": True, "ids": package["ids"], "source_sha256": package["source_sha256"],
                      "authority_effect": "none", **intake.usage()}
        elif args.command == "import":
            result = intake.import_feedback(args.source, args.source_sha256, args.actor)
        else:
            result = intake.propose(args.ids, args.objective, args.name)
        output = encode(result)
        require(len(output) <= MAX_STDOUT, "Console output budget exceeded")
        print(output.decode("utf-8").rstrip())
        return 0
    except (IntakeError, OSError, TypeError, KeyError, RecursionError) as error:
        message = str(error)[:1000]
        print(json.dumps({"error": message, "authority_effect": "none"}, ensure_ascii=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
