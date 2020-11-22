import { Address, IDAOState, IProposalStage, IContributionRewardExtState, IProposalOutcome } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import FollowButton from "components/Shared/FollowButton";
import { humanProposalTitle, ensureHttps, formatFriendlyDateForLocalTimezone, safeMoment } from "lib/util";
import Analytics from "lib/analytics";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Link, RouteComponentProps } from "react-router-dom";
import { closingTime, proposalEnded } from "lib/proposalHelpers";
import { pluginName } from "lib/pluginUtils";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import { rewarderContractName } from "components/Plugin/ContributionRewardExtRewarders/rewardersProps";
import SocialShareModal from "../Shared/SocialShareModal";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import { default as ProposalData, IInjectedProposalProps } from "./ProposalData";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";
import ProposalDescription from "components/Shared/ProposalDescription";
import ThreeBoxThreads from "components/Shared/ThreeBoxThreads";
import i18next from "i18next";

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  detailView?: boolean;
  proposalId: string;
}

type IProps = IExternalProps & IInjectedProposalProps;

interface IState {
  showVotersModal: boolean;
  showShareModal: boolean;
  currentAccountVote: number;
  crxContractName: string;
}

class ProposalDetailsPage extends React.Component<IProps, IState> {
  private proposalClass = classNames({
    [css.proposal]: true,
    clearfix: true,
  });

  constructor(props: IProps) {
    super(props);

    this.state = {
      showShareModal: false,
      showVotersModal: false,
      currentAccountVote: 0,
      crxContractName: null,
    };
  }

  public componentDidMount() {
    const newState: IState = {} as any;

    Analytics.track("Page View", {
      "Page Name": Page.ProposalDetails,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
      "Proposal Hash": this.props.proposalState.id,
      "Proposal Title": this.props.proposalState.title,
      "Plugin Address": this.props.proposalState.plugin.id,
      "Plugin Name": this.props.proposalState.plugin.entity.coreState.name,
    });

    if (this.props.votes.length > 0) {
      const currentVote = this.props.votes[0];
      newState.currentAccountVote = currentVote.coreState.outcome;
    }

    newState.crxContractName = rewarderContractName(this.props.proposalState.plugin.entity.coreState as IContributionRewardExtState);
    this.setState(newState);
  }

  private showShareModal = (_event: any): void => {
    this.setState({ showShareModal: true });
  }

  private closeShareModal = (_event: any): void => {
    this.setState({ showShareModal: false });
  }

  private showVotersModal = (votesCount: number) => (_event: any): void => {
    if (votesCount > 0) {
      this.setState({ showVotersModal: true });
    }
  }

  private closeVotersModal = (_event: any): void => {
    this.setState({ showVotersModal: false });
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountGenAllowance,
      currentAccountGenBalance,
      daoEthBalance,
      daoState,
      expired,
      member,
      proposalState,
      rewards,
      stakes,
      votes,
    } = this.props;

    if (daoState.id !== proposalState.dao.id) {
      return <div>`The given proposal does not belong to ${daoState.name}. Please check the browser url.`</div>;
    }

    const tags = proposalState.tags;

    const url = ensureHttps(proposalState.url);

    let currentAccountVote: IProposalOutcome | undefined;

    if (votes.length > 0) {
      const currentVote = this.props.votes[0];
      currentAccountVote = currentVote.coreState.outcome;
    }

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/plugin/${proposalState.plugin.id}`}>{pluginName(proposalState.plugin.entity.coreState, proposalState.plugin.entity.coreState.address)}</BreadcrumbsItem>
        <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState, 40)}</BreadcrumbsItem>
        <div className={this.proposalClass} data-test-id={"proposal-" + proposalState.id}>
          <div className={css.proposalInfo}>
            <div>
              <div className={css.statusContainer}>
                <ProposalStatus proposalState={proposalState} />
              </div>

              <div className={css.actionButtonContainer}>
                <ActionButton
                  currentAccountAddress={currentAccountAddress}
                  daoState={daoState}
                  daoEthBalance={daoEthBalance}
                  detailView
                  parentPage={Page.ProposalDetails}
                  proposalState={proposalState}
                  rewards={rewards}
                  expired={expired}
                />
              </div>
              {
                (this.state.crxContractName) ? <div className={css.gotoCompetition}>
                  {
                    <Link to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>Go to {this.state.crxContractName}&nbsp;&gt;</Link>
                  }
                </div> : ""
              }
            </div>
            <h3 className={css.proposalTitleTop}>
              <Link to={"/dao/" + daoState.address + "/proposal/" + proposalState.id} data-test-id="proposal-title">{humanProposalTitle(proposalState)}</Link>
            </h3>
            {!proposalState.plugin.entity.coreState.isRegistered && <div className={css.unregistered}>({i18next.t("Unregistered Plugin Proposal")})</div>}
            <div className={css.timer + " clearfix"}>
              {!proposalEnded(proposalState) ?
                <span className={css.content}>
                  {!expired ?
                    <ProposalCountdown proposalState={proposalState} detailView /> :
                    <span className={css.closedTime}>
                      {proposalState.stage === IProposalStage.Queued ? "Expired" :
                        proposalState.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                          "Closed"}&nbsp;
                      {closingTime(proposalState).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "}
            </div>

            <div className={css.createdBy}>
              <AccountPopup accountAddress={proposalState.proposer} daoState={daoState} width={35} />
              <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView />
            </div>

            <div className={css.description}>
              <ProposalDescription description={proposalState.description} />
            </div>

            {url ?
              <a href={url} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/Icon/Attachment.svg" />
            Attachment &gt;
              </a>
              : " "
            }

            <div className={classNames({
              [css.proposalSummaryContainer]: true,
              [css.hasTags]: tags && tags.length,
            })}>
              <ProposalSummary proposalState={proposalState} daoState={daoState} beneficiaryProfile={beneficiaryProfile} detailView />
            </div>

            {tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : ""}

            <div className={css.buttonBar}>
              <div className={css.voteButtonsBottom}>
                <span className={css.voteLabel}>Vote:</span>
                <div className={css.altVoteButtons}>
                  <VoteButtons
                    altStyle
                    currentAccountAddress={currentAccountAddress}
                    currentVote={currentAccountVote}
                    daoState={daoState}
                    expired={expired}
                    currentAccountState={member}
                    proposalState={proposalState}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <button onClick={this.showShareModal} className={css.shareButton} data-test-id="share">
                <img src={"/assets/images/Icon/share-white.svg"} />
                <span>Share</span>
              </button>

              <div className={css.followButton}><FollowButton type="proposals" id={proposalState.id} style="bigButton" /></div>
            </div>
          </div>

          <div className={css.proposalActions + " clearfix"}>
            <div className={css.votes}>
              <div className={css.header}>
                <div className={css.title}>Votes</div>
                <div onClick={this.showVotersModal(proposalState.votesCount)} className={classNames({ [css.voters]: true, [css.clickable]: proposalState.votesCount > 0 })}>
                  {proposalState.votesCount} Vote{proposalState.votesCount === 1 ? "" : "s"} &gt;
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons
                    currentAccountAddress={currentAccountAddress}
                    currentAccountState={member}
                    currentVote={currentAccountVote}
                    daoState={daoState}
                    expired={expired}
                    proposalState={proposalState}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <div className={css.voteStatus}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} proposalState={proposalState} />
                </div>

                <VoteBreakdown
                  currentAccountAddress={currentAccountAddress}
                  currentAccountState={member}
                  currentVote={currentAccountVote}
                  daoState={daoState}
                  detailView
                  proposalState={proposalState} />
              </div>
            </div>

            <div className={css.predictions}>
              <div className={css.header}>
                <div className={css.title}>Predictions</div>

                <div className={css.stakeButtons}>
                  <StakeButtons
                    beneficiaryProfile={beneficiaryProfile}
                    currentAccountAddress={currentAccountAddress}
                    currentAccountGens={currentAccountGenBalance}
                    currentAccountGenStakingAllowance={currentAccountGenAllowance}
                    daoState={daoState}
                    parentPage={Page.ProposalDetails}
                    expired={expired}
                    proposalState={proposalState}
                    stakes={stakes}
                  />
                </div>
              </div>

              <div className={css.predictionStatus}>
                <StakeGraph
                  proposalState={proposalState}
                  detailView
                />
                <BoostAmount detailView expired={expired} proposalState={proposalState} />
              </div>

            </div>
            <div className={css.eventHistory}>
              <div className={css.event}>
                <div className={css.label}>{i18next.t("Created")}:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(safeMoment(proposalState.createdAt))}</div>
              </div>
              {proposalState.executedAt ?
                <div className={css.event}>
                  <div className={css.label}>{i18next.t("Executed")}:</div>
                  <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(safeMoment(proposalState.executedAt))}</div>
                </div> : ""}
            </div>
          </div>
        </div>

        <h3 className={css.discussionTitle}>Discussion</h3>
        <div className={css.threebox}>
          <ThreeBoxThreads threadId={this.props.proposalId} daoState={daoState} currentAccountAddress={this.props.currentAccountAddress}></ThreeBoxThreads>
        </div>

        {this.state.showVotersModal ?
          <VotersModal
            closeAction={this.closeVotersModal}
            currentAccountAddress={this.props.currentAccountAddress}
            daoState={daoState}
            proposalState={proposalState}
            accountProfile={creatorProfile}
          /> : ""
        }

        {this.state.showShareModal ?
          <SocialShareModal
            closeHandler={this.closeShareModal}
            url={`${process.env.BASE_URL}/dao/${daoState.address}/proposal/${proposalState.id}`}
          /> : ""
        }
      </div>
    );
  }
}

export default function ProposalDetailsPageData(props: IExternalProps): JSX.Element {
  const { currentAccountAddress, daoState, proposalId } = props;
  return <ProposalData currentAccountAddress={currentAccountAddress} daoState={daoState} proposalId={proposalId} subscribeToProposalDetails>
    {proposalData => <ProposalDetailsPage {...props} {...proposalData} />}
  </ProposalData>;
}
