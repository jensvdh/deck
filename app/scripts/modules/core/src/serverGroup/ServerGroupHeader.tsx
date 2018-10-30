import * as React from 'react';
import { get } from 'lodash';

import { NgReact } from 'core/reactShims';
import { Application } from 'core/application';
import { IServerGroup } from 'core/domain';
import { IJenkinsViewModel, IDockerViewModel } from 'core/serverGroup/ServerGroup';
import { EntityNotifications } from 'core/entityTag/notifications/EntityNotifications';
import { HealthCounts } from 'core/healthCounts';
import { NameUtils } from 'core/naming';
import { CloudProviderLogo } from 'core/cloudProvider';
import { LoadBalancersTagWrapper } from 'core/loadBalancer';
import { ISortFilter } from 'core/filterModel';
import { Overridable } from 'core/overrideRegistry';

export interface IServerGroupHeaderProps {
  application: Application;
  images?: string[];
  isMultiSelected: boolean;
  jenkins: IJenkinsViewModel;
  docker: IDockerViewModel;
  serverGroup: IServerGroup;
  sortFilter: ISortFilter;
}

export class LoadBalancers extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { application, serverGroup } = this.props;
    const hasLoadBalancer = !!get(serverGroup, 'loadBalancers.length') || !!get(serverGroup, 'targetGroups.length');
    return (
      hasLoadBalancer && <LoadBalancersTagWrapper key="lbwrapper" application={application} serverGroup={serverGroup} />
    );
  }
}

export class MultiSelectCheckbox extends React.Component<IServerGroupHeaderProps> {
  public render() {
    // ServerGroup.tsx handles multi-select events and state
    const {
      isMultiSelected,
      sortFilter: { multiselect },
    } = this.props;
    return multiselect && <input type="checkbox" checked={isMultiSelected} />;
  }
}

export class CloudProviderIcon extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { serverGroup } = this.props;
    return <CloudProviderLogo provider={serverGroup.type} height="16px" width="16px" />;
  }
}

export interface ImageListState {
  expanded: boolean;
}

export class ImageList extends React.Component<IServerGroupHeaderProps, ImageListState> {
  private toggle() {
    this.setState({
      expanded: !this.state.expanded,
    });
  }

  constructor(props: IServerGroupHeaderProps) {
    super(props);

    this.state = {
      expanded: false,
    };

    this.toggle = this.toggle.bind(this);
  }

  public render() {
    const { images } = this.props;
    const { expanded } = this.state;

    return (
      <>
        <span>{images.length} containers</span>
        &nbsp;
        <span onClick={this.toggle}>{expanded ? 'hide' : 'show'} all</span>
        <ul>{expanded && images.map(image => <li key={image}>{image}</li>)}</ul>
      </>
    );
  }
}

export class SequenceAndBuildAndImages extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { serverGroup, jenkins, images, docker } = this.props;
    const serverGroupSequence = NameUtils.getSequence(serverGroup.moniker.sequence);
    return (
      <div>
        {!!serverGroupSequence && <span className="server-group-sequence"> {serverGroupSequence}</span>}
        {!!serverGroupSequence && (!!jenkins || !!images) && <span>: </span>}
        {!!jenkins && (
          <a className="build-link" href={jenkins.href} target="_blank">
            Build: #{jenkins.number}
          </a>
        )}
        {!!docker && (
          <a className="build-link" href={docker.href} target="_blank">
            {docker.image}:{docker.tag}
          </a>
        )}
        {!!images && <ImageList {...this.props} />}
      </div>
    );
  }
}

export class Alerts extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { application, serverGroup } = this.props;
    return (
      <EntityNotifications
        application={application}
        entity={serverGroup}
        entityType="serverGroup"
        hOffsetPercent="20%"
        onUpdate={() => application.serverGroups.refresh()}
        pageLocation="pod"
        placement="top"
      />
    );
  }
}

@Overridable('serverGroups.pod.header.health')
export class Health extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { serverGroup } = this.props;
    return <HealthCounts className="no-float" container={serverGroup.instanceCounts} />;
  }
}

export class RunningTasks extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const { application, serverGroup } = this.props;
    const { RunningTasksTag } = NgReact;
    const hasRunningExecutions = !!serverGroup.runningExecutions.length || !!serverGroup.runningTasks.length;

    return (
      hasRunningExecutions && (
        <RunningTasksTag
          application={application}
          tasks={serverGroup.runningTasks}
          executions={serverGroup.runningExecutions}
        />
      )
    );
  }
}

@Overridable('serverGroups.pod.header')
export class ServerGroupHeader extends React.Component<IServerGroupHeaderProps> {
  public render() {
    const props = this.props;

    return (
      <div className={`flex-container-h baseline server-group-title sticky-header-3`}>
        <div className="flex-container-h baseline section-title">
          <MultiSelectCheckbox {...props} />
          <CloudProviderIcon {...props} />
          <SequenceAndBuildAndImages {...props} />
          <Alerts {...props} />
        </div>

        <div className="flex-container-h baseline flex-pull-right">
          <RunningTasks {...props} />
          <LoadBalancers {...props} />
          <Health {...props} />
        </div>
      </div>
    );
  }
}
