import { goToUrl } from "./utils";

describe("All DAOs", () => {
  it("Works", async () => {
    await goToUrl("http://127.0.0.1:3000/daos");
    const title = await browser.getTitle();
    title.should.be.equal("Alchemy | DAOstack");
    const daosHeader = await $("*[data-test-id=\"header-all-daos\"]");
    await daosHeader.waitForExist();
    const daoLink = await $("*[data-test-id=\"dao-link\"]");
    await daoLink.click();
  });
});
