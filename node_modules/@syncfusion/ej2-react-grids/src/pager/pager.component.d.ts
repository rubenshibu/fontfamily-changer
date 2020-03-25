import * as React from 'react';
import { Pager, PagerModel } from '@syncfusion/ej2-grids';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
export interface PagerTypecast {
    template?: string | Function | any;
}
/**
 * `PagerComponent` represents the react Pager.
 * ```tsx
 * <PagerComponent/>
 * ```
 */
export declare class PagerComponent extends Pager {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<PagerModel & DefaultHtmlAttributes | PagerTypecast>;
    setState: any;
    private getDefaultAttributes;
    initRenderCalled: boolean;
    private checkInjectedModules;
    private immediateRender;
    props: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<PagerModel & DefaultHtmlAttributes | PagerTypecast>;
    forceUpdate: (callBack?: () => any) => void;
    context: Object;
    isReactComponent: Object;
    refs: {
        [key: string]: React.ReactInstance;
    };
    constructor(props: any);
    render(): any;
}
