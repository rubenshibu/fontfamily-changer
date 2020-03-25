/**
 * React Component Base
 */
import * as React from 'react';
export declare class ComponentBase<P, S> extends React.PureComponent<P, S> {
    private setProperties;
    private element;
    private appendTo;
    private destroy;
    private getModuleName;
    private prevProperties;
    private checkInjectedModules;
    private curModuleName;
    private getInjectedModules;
    private injectedModules;
    private skipRefresh;
    protected htmlattributes: {
        [key: string]: Object;
    };
    private controlAttributes;
    directivekeys: {
        [key: string]: Object;
    };
    private attrKeys;
    private cachedTimeOut;
    private isAppendCalled;
    private isReact;
    private modelObserver;
    private isDestroyed;
    private isProtectedOnChange;
    private canDelayUpdate;
    /**
     * @private
     */
    UNSAFE_componentWillMount(): void;
    componentDidMount(): void;
    private renderReactComponent;
    /**
     * @private
     */
    UNSAFE_componentWillReceiveProps(nextProps: Object): void;
    refreshProperties(dProps: Object, nextProps: Object): void;
    private processComplexTemplate;
    getDefaultAttributes(): Object;
    trigger(eventName: string, eventProp?: any, successHandler?: any): void;
    compareObjects(oldProps: Object, newProps: Object): boolean;
    private refreshChild;
    componentWillUnmount(): void;
    private validateChildren;
    private getChildType;
    getChildProps(subChild: React.ReactNode[], matcher: {
        [key: string]: Object;
    } & string): Object[];
    getInjectedServices(): Object[];
}
