"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
var LABEL_NAMES = [
    "categorify",
    "choose_model_class",
    "commented",
    "compute_test_metric",
    "compute_train_metric",
    "concatenate",
    "correct_missing_values",
    "count_duplicates",
    "count_missing_values",
    "count_unique_values",
    "count_values",
    "create_dataframe",
    "data_type_conversions",
    "define_search_model",
    "define_search_space",
    "define_variables",
    "distribution",
    "drop_column",
    "feature_engineering",
    "features_selection",
    "filter",
    "find_best_model_class",
    "find_best_params",
    "find_best_score",
    "groupby",
    "heatmap",
    "import_modules",
    "init_hyperparams",
    "install_modules",
    "learning_history",
    "list_files",
    "load_from_csv",
    "load_from_disk",
    "load_from_url",
    "load_from_zip",
    "load_pretrained",
    "merge",
    "missing_values",
    "model_coefficients",
    "normalization",
    "plot_predictions",
    "predict_on_test",
    "prepare_output",
    "prepare_x_and_y",
    "randomize_order",
    "relationship",
    "remove_duplicates",
    "rename_columns",
    "save_model",
    "save_to_csv",
    "set_options",
    "show_columns",
    "show_data_types",
    "show_shape",
    "show_table",
    "show_table_attributes",
    "show_unique_values",
    "sort_values",
    "split",
    "statistical_test",
    "string_transform",
    "time_series",
    "train_model",
    "train_on_grid"
];
function activate(context) {
    const codeGeneratorProvider = new CodeGeneratorProvider();
    vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider));
    let disposable = vscode.commands.registerCommand('extension.activateCodeGenerator', () => {
        vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider);
        vscode.window.showInformationMessage('Code Generator View Activated!');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
class CodeGeneratorProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    selectedModel = 'Seleccionar Modelo';
    maxLength = 100;
    status = 'Disponible';
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return [
            new LabelItem('Modelo Seleccionado:'),
            new ModelSelectionItem(this),
            new MaxLengthInputItem(this),
            new StatusItem(this.status),
            new GenerateButtonItem(this)
        ];
    }
    updateView() {
        this._onDidChangeTreeData.fire();
    }
    async generateCode() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (text.length + this.maxLength > 1064) {
            vscode.window.showErrorMessage('Se pasa de la longitud permitida');
            return;
        }
        this.status = 'Cargando...';
        this.updateView();
        vscode.window.showInformationMessage('Código generando...');
        try {
            const response = await axios_1.default.post('https://kindly-main-titmouse.ngrok-free.app/generate/', {
                prompt: text,
                model: this.selectedModel,
                max_length: this.maxLength
            });
            const generatedCode = response.data.generated_text;
            console.log('Código generado:', generatedCode);
            editor.edit(editBuilder => {
                editBuilder.replace(selection, generatedCode);
            });
            vscode.window.showInformationMessage('Código generado exitosamente.');
            this.status = 'Disponible';
        }
        catch (error) {
            if (this.selectedModel == "Seleccionar Modelo") {
                console.error('Error al generar código:', error);
                this.status = 'Error';
                vscode.window.showErrorMessage('Selecionar Modelo.');
            }
            else {
                console.error('Error al generar código:', error);
                this.status = 'Error';
                vscode.window.showErrorMessage('Error al generar el código.');
            }
        }
        this.updateView();
    }
    setModel(model) {
        this.selectedModel = model;
        this.updateView();
    }
    setMaxLength(maxLength) {
        const maxVal = parseInt(maxLength, 10);
        if (maxVal > 1064) {
            vscode.window.showErrorMessage('La longitud máxima no puede exceder 1064 caracteres.');
            return;
        }
        this.maxLength = maxVal || 150;
        this.updateView();
    }
}
class LabelItem extends vscode.TreeItem {
    constructor(label) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'label';
    }
}
class ModelSelectionItem extends vscode.TreeItem {
    provider;
    constructor(provider) {
        super(provider.selectedModel, vscode.TreeItemCollapsibleState.None);
        this.provider = provider;
        this.command = {
            command: 'extension.selectModel',
            title: 'Seleccionar Modelo',
            arguments: [provider]
        };
        this.contextValue = 'selectModel';
    }
}
class MaxLengthInputItem extends vscode.TreeItem {
    provider;
    constructor(provider) {
        super(`Longitud Máxima: ${provider.maxLength}`, vscode.TreeItemCollapsibleState.None);
        this.provider = provider;
        this.command = {
            command: 'extension.setMaxLength',
            title: 'Establecer Longitud Máxima',
            arguments: [provider]
        };
        this.contextValue = 'inputMaxLength';
    }
}
class StatusItem extends vscode.TreeItem {
    constructor(status) {
        super(`Estado: ${status}`, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'status';
    }
}
class GenerateButtonItem extends vscode.TreeItem {
    provider;
    constructor(provider) {
        super('🚀 GENERAR CÓDIGO', vscode.TreeItemCollapsibleState.None);
        this.provider = provider;
        this.command = {
            command: 'extension.generateCode',
            title: 'Generar Código',
            arguments: [provider]
        };
        this.contextValue = 'generateButton';
        this.tooltip = 'Haz clic para generar código';
    }
}
vscode.commands.registerCommand('extension.selectModel', async (provider) => {
    const model = await vscode.window.showQuickPick(LABEL_NAMES, {
        placeHolder: 'Selecciona un modelo'
    });
    if (model) {
        provider.setModel(model);
    }
});
vscode.commands.registerCommand('extension.setMaxLength', async (provider) => {
    const maxLength = await vscode.window.showInputBox({
        placeHolder: 'Ingresa la longitud máxima',
        value: provider.maxLength.toString()
    });
    if (maxLength) {
        provider.setMaxLength(maxLength);
    }
});
vscode.commands.registerCommand('extension.generateCode', async (provider) => {
    await provider.generateCode();
});
//# sourceMappingURL=extension.js.map