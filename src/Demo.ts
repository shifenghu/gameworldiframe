export default () => {
  const sandbox = window.Sandbox;
  sandbox.evaluate(`
        Account.GetInfo().then(console.log);
    `);
};
