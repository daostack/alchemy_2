import { getTestAddresses, ITestAddresses, hideCookieAcceptWindow, goToUrl } from "./utils";

describe("Header redemptions button", () => {
  it("shouldn't be there if the user isn't logged in", async () => {
    await goToUrl("http://127.0.0.1:3000");

    const redemptionsButton = await $("[data-test-id=\"redemptionsButton\"]");
    (await redemptionsButton.isDisplayed()).should.equal(false);
  });

  it("should show a quick menu on desktop devices", async () => {
    hideCookieAcceptWindow();
    await goToUrl("http://127.0.0.1:3000");
    const loginButton = await $("[data-test-id=\"loginButton\"]");
    await loginButton.click();

    const redemptionsButton = await $("[data-test-id=\"redemptionsButton\"]");
    await redemptionsButton.waitForDisplayed();
    await redemptionsButton.click();

    const viewAllRedemptionsLink = await $("[data-test-id=\"viewAllRedemptionsLink\"]");
    await viewAllRedemptionsLink.waitForDisplayed();
    await viewAllRedemptionsLink.click();
  });

  it("should redirect us to the redemptions page on mobile devices", async () => {
    await browser.setWindowSize(600, 600);
    await goToUrl("http://127.0.0.1:3000");
    const windowSize = await browser.getWindowSize();

    // Skip test if the OS doesn't allow window to be resized
    if (windowSize.width <= 640) {
      const redemptionsButton = await $("[data-test-id=\"redemptionsButton\"]");
      await redemptionsButton.waitForDisplayed();
      await redemptionsButton.click();

      (await browser.getUrl()).should.equal("http://127.0.0.1:3000/redemptions");
    }

    await browser.setWindowSize(1920, 1080);
  });
});

describe("Redemptions page", () => {
  let testAddresses: ITestAddresses;

  before(() => {
    testAddresses = getTestAddresses();
  });

  it("should exist", async () => {
    await browser.setWindowSize(1920, 1080);
    await goToUrl("http://127.0.0.1:3000/redemptions");

    const pageTitle = await browser.getTitle();
    pageTitle.should.be.equal("Alchemy | DAOstack");
  });

  it("should redeem a reward", async () => {
    await hideCookieAcceptWindow();

    await goToUrl("http://127.0.0.1:3000/redemptions");
    const connectButton = await $("*[data-test-id=\"connectButton\"]");
    await connectButton.waitForDisplayed();
    await connectButton.click();

    const proposalId = testAddresses.executedProposalId;
    const proposalCard = await $(`[data-test-id="proposal-${proposalId}"]`);
    await proposalCard.waitForExist();

    const redeemButton = await $("[data-test-id=\"button-redeem\"]");
    await redeemButton.click();

    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
  });
});
