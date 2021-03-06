import { Address, IDAOState, IProposalState, IRewardState, IContributionRewardProposalState } from "@daostack/arc.js";

import BN = require("bn.js");
import Reputation from "components/Account/Reputation";
import { baseTokenName, genName, getCRRewards, getGpRewards, formatTokens, tokenDecimals, tokenSymbol } from "lib/util";
import * as React from "react";
import * as css from "./RedemptionsString.scss";

interface IProps {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposal: IProposalState;
  rewards: IRewardState | null;
  separator?: string;
}

export default class RedemptionsString extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { currentAccountAddress, daoState, proposal, rewards } = this.props;
    let separator = this.props.separator;

    const zero = new BN(0);
    const rewardComponents: any = [];
    let reputation = new BN(0);
    let gen = new BN(0);

    const gpRewards = getGpRewards(rewards);

    if (gpRewards) {
      if (gpRewards.reputationForProposer && gpRewards.reputationForProposer.gt(zero)) {
        reputation = reputation.add(gpRewards.reputationForProposer);
      }
      if (gpRewards.reputationForVoter && gpRewards.reputationForVoter.gt(zero)) {
        reputation = reputation.add(gpRewards.reputationForVoter);
      }
      if (gpRewards.tokensForStaker && gpRewards.tokensForStaker.gt(zero)) {
        gen = gen.add(gpRewards.tokensForStaker);
      }
      if (gpRewards.daoBountyForStaker && gpRewards.daoBountyForStaker.gt(zero)) {
        gen = gen.add(gpRewards.daoBountyForStaker);
      }
    }

    const proposalState = proposal;
    const contributionReward = proposal as IContributionRewardProposalState;

    if ((proposalState.name === "ContributionReward") && contributionReward && currentAccountAddress === contributionReward.beneficiary) {
      const rewards = getCRRewards(contributionReward);
      if (rewards.ethReward && rewards.ethReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.ethReward, baseTokenName()));
      }
      if (rewards.externalTokenReward && rewards.externalTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.externalTokenReward, tokenSymbol(contributionReward.externalToken), tokenDecimals(contributionReward.externalToken)));
      }
      if (rewards.nativeTokenReward && rewards.nativeTokenReward.gt(zero)) {
        rewardComponents.push(formatTokens(rewards.nativeTokenReward, daoState.tokenSymbol));
      }
      if (rewards.rep && rewards.rep.gt(zero)) {
        reputation = reputation.add(rewards.rep);
      }
    }

    if (gen.gt(zero)) {
      rewardComponents.push(formatTokens(gen, genName()));
    }

    if (reputation.gt(zero)) {
      rewardComponents.push(
        <Reputation reputation={reputation} totalReputation={daoState.reputationTotalSupply} daoName={daoState.name} />);
    }

    separator = separator || "+";

    return <div className={css.container}>
      {rewardComponents.map((component: any, index: number) => {
        return (
          <div className={css.reward} key={index}>
            {index ? <span className={css.separator}>{separator}</span> : ""}
            {component}
          </div>
        );
      })
      }
    </div>;
  }
}
