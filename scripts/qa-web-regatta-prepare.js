async (page) => {
  await page.setViewportSize({width:1280,height:800});
  await page.goto(page.url().split('#')[0]+'#perfiles');
  if(await page.locator('#logout').count()) await page.locator('#logout').click();
  const form=page.locator('#create-profile');
  await form.locator('[name=alias]').fill('Ciclo QA '+Date.now().toString().slice(-5));
  await form.locator('[name=password]').fill('sendero-prueba');
  await form.locator('[name=repeat]').fill('sendero-prueba');
  await form.getByRole('button',{name:'Crear y entrar',exact:true}).click();
  await page.getByRole('button',{name:/MULTIPLICACIÓN La huerta/}).waitFor();
  return {syntheticProfile:true, viewport:page.viewportSize(),url:page.url()};
}
