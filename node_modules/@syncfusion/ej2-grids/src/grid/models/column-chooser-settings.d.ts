import { ChildProperty } from '@syncfusion/ej2-base';
/**
 * Configures the column chooser behavior of the Grid.
 */
export declare class ColumnChooserSettings extends ChildProperty<ColumnChooserSettings> {
    /**
     * Defines the search operator for Column Chooser.
     *
     * @default 'startsWith'
     * @blazorType Syncfusion.EJ2.Blazor.Operator
     * @blazorDefaultValue Syncfusion.EJ2.Blazor.Operator.StartsWith
     */
    operator: string;
}
