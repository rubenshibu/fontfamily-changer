import * as React from 'react';
import { Grid, GridModel } from '@syncfusion/ej2-grids';
import { DefaultHtmlAttributes } from '@syncfusion/ej2-react-base';
export interface GridTypecast {
    rowTemplate?: string | Function | any;
    detailTemplate?: string | Function | any;
    toolbarTemplate?: string | Function | any;
    pagerTemplate?: string | Function | any;
    editSettingsTemplate?: string | Function | any;
    groupSettingsCaptionTemplate?: string | Function | any;
}
/**
 * `GridComponent` represents the react Grid.
 * ```tsx
 * <GridComponent dataSource={data} allowPaging={true} allowSorting={true}/>
 * ```
 */
export declare class GridComponent extends Grid {
    state: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<GridModel & DefaultHtmlAttributes | GridTypecast>;
    setState: any;
    private getDefaultAttributes;
    initRenderCalled: boolean;
    private checkInjectedModules;
    directivekeys: {
        [key: string]: Object;
    };
    private immediateRender;
    props: Readonly<{
        children?: React.ReactNode | React.ReactNode[];
    }> & Readonly<GridModel & DefaultHtmlAttributes | GridTypecast>;
    forceUpdate: (callBack?: () => any) => void;
    context: Object;
    isReactComponent: Object;
    refs: {
        [key: string]: React.ReactInstance;
    };
    constructor(props: any);
    render(): any;
}
