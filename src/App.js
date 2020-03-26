import { Count, HtmlEditor, Image, Inject, Link, QuickToolbar, RichTextEditorComponent, Toolbar } from '@syncfusion/ej2-react-richtexteditor';
import * as React from 'react';
import './App';
class App extends React.Component {
    constructor() {
        super(...arguments);
        this.fontFamily = {
            default: "Noto Sans",
            items: [
                { text: "Segoe UI", value: "Segoe UI", class: "e-segoe-ui", command: "Font", subCommand: "FontName" },
                { text: "Roboto", value: "Roboto", command: "Font", subCommand: "FontName" },
                { text: "Great vibes", value: "Great Vibes,cursive", command: "Font", subCommand: "FontName" },
                { text: "Noto Sans", value: "Noto Sans", command: "Font", subCommand: "FontName" },
                { text: "Impact", value: "Impact,Charcoal,sans-serif", class: "e-impact", command: "Font", subCommand: "FontName" },
                { text: "Tahoma", value: "Tahoma,Geneva,sans-serif", class: "e-tahoma", command: "Font", subCommand: "FontName" },
            ]
        };
        this.toolbarSettings = {
            items: ['Bold', 'Italic', 'Underline', 'StrikeThrough', '|',
                'FontName', 'FontSize', 'FontColor', 'BackgroundColor',
                'LowerCase', 'UpperCase', '|',
                'Formats', 'Alignments', 'OrderedList', 'UnorderedList',
                'Outdent', 'Indent', '|',
                'CreateLink', 'Image', '|', 'ClearFormat', 'Print',
                'SourceCode', 'FullScreen', '|', 'Undo', 'Redo']
        };
        this.cssClass = "customClass";
    }
    render() {
        return (<RichTextEditorComponent toolbarSettings={this.toolbarSettings} fontFamily={this.fontFamily} cssClass={this.cssClass}>
    
        <Inject services={[Toolbar, Count, Image, Link, HtmlEditor, QuickToolbar]}/>
      </RichTextEditorComponent>);
    }
}
export default App;