import * as vscode from 'vscode';
import axios from 'axios';

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
]

export function activate(context: vscode.ExtensionContext) {
  const codeGeneratorProvider = new CodeGeneratorProvider();
  vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider)
  );

  let disposable = vscode.commands.registerCommand('extension.activateCodeGenerator', () => {
    vscode.window.registerTreeDataProvider('codeGeneratorView', codeGeneratorProvider);
    vscode.window.showInformationMessage('Code Generator View Activated!');
  });

  context.subscriptions.push(disposable);
}

class CodeGeneratorProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  public selectedModel: string = 'Seleccionar Modelo';
  public maxLength: number = 100;
  public status: string = 'Disponible';

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
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
    if (!editor) return;

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
      const response = await axios.post('https://kindly-main-titmouse.ngrok-free.app/generate/', {
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
    } catch (error) {
      if (this.selectedModel == "Seleccionar Modelo") {
        console.error('Error al generar código:', error);
        this.status = 'Error';
        vscode.window.showErrorMessage('Selecionar Modelo.');
      } else {
        console.error('Error al generar código:', error);
        this.status = 'Error';
        vscode.window.showErrorMessage('Error al generar el código.');
      }
    }

    this.updateView();
  }

  setModel(model: string) {
    this.selectedModel = model;
    this.updateView();
  }

  setMaxLength(maxLength: string) {
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
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'label';
  }
}

class ModelSelectionItem extends vscode.TreeItem {
  constructor(private provider: CodeGeneratorProvider) {
    super(provider.selectedModel, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: 'extension.selectModel',
      title: 'Seleccionar Modelo',
      arguments: [provider]
    };
    this.contextValue = 'selectModel';
  }
}

class MaxLengthInputItem extends vscode.TreeItem {
  constructor(private provider: CodeGeneratorProvider) {
    super(`Longitud Máxima: ${provider.maxLength}`, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: 'extension.setMaxLength',
      title: 'Establecer Longitud Máxima',
      arguments: [provider]
    };
    this.contextValue = 'inputMaxLength';
  }
}

class StatusItem extends vscode.TreeItem {
  constructor(status: string) {
    super(`Estado: ${status}`, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'status';
  }
}

class GenerateButtonItem extends vscode.TreeItem {
  constructor(private provider: CodeGeneratorProvider) {
    super('🚀 GENERAR CÓDIGO', vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: 'extension.generateCode',
      title: 'Generar Código',
      arguments: [provider]
    };
    this.contextValue = 'generateButton';
    this.tooltip = 'Haz clic para generar código';
  }
}

vscode.commands.registerCommand('extension.selectModel', async (provider: CodeGeneratorProvider) => {
  const model = await vscode.window.showQuickPick(LABEL_NAMES, {
    placeHolder: 'Selecciona un modelo'
  });
  if (model) {
    provider.setModel(model);
  }
});

vscode.commands.registerCommand('extension.setMaxLength', async (provider: CodeGeneratorProvider) => {
  const maxLength = await vscode.window.showInputBox({
    placeHolder: 'Ingresa la longitud máxima',
    value: provider.maxLength.toString()
  });
  if (maxLength) {
    provider.setMaxLength(maxLength);
  }
});

vscode.commands.registerCommand('extension.generateCode', async (provider: CodeGeneratorProvider) => {
  await provider.generateCode();
});
