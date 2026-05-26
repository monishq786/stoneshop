sap.ui.define([
    'core/generic/genericentryform',
    "sap/ui/model/json/JSONModel",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/m/MessageToast",
    'stoneman/modone/constants/FormMode',
],
    function (genericentryform, JSONModel, TextArea, Button, MessageToast, FormMode) {
        "use strict";
        return genericentryform.extend("modreportcontroller.inspectionbuilderentryform", {

            onInit: function () {
                genericentryform.prototype.onInit.apply(this, arguments);
            },

            onBeforeShow: async function () {
                this.identifyFormMode();
                this.initialize();
                this.setEntryFormDataSourceURLForEditMode(
                    '/odata/v4/inspection/MInspectionTypes(' +
                    this.getListViewEditPropertyValue() + ')?$expand=approvalTemplate,sections($expand=fields,tables($expand=columns);$orderby=sequenceNo asc)'
                );
                await this.showEntryForm();

                //  Create models BEFORE the view renders
                if (this.formMode !== FormMode.CREATE) {

                    const oRawData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();

                    oRawData.sections?.forEach(section => {

                        // Handle fields
                        section.fields?.forEach(field => {
                            if (field.metaData && typeof field.metaData === "string") {
                                try {
                                    field.metaData = JSON.parse(field.metaData);
                                } catch (e) {
                                    field.metaData = {};
                                }
                            }
                        });

                        // Handle tables → columns
                        section.tables?.forEach(table => {
                            table.columns?.forEach(column => {
                                if (column.metaData && typeof column.metaData === "string") {
                                    try {
                                        column.metaData = JSON.parse(column.metaData);
                                    } catch (e) {
                                        column.metaData = {};
                                    }
                                }
                            });
                        });

                    });

                    // Normalize data
                    const oFormData = {
                        ID: oRawData.ID,
                        name: oRawData.name,
                        label: oRawData.label || oRawData.name,
                        code: oRawData.code,
                        version: oRawData.version,
                        isActive: oRawData.isActive,
                        TemplateName: oRawData.approvalTemplate?.TemplateName || "",
                        approvalTemplate: {
                            TemplateGuid: oRawData.approvalTemplate_TemplateGuid || ""
                        },
                        sections: oRawData.sections || []
                    };

                    // Create formModel
                    const oFormModel = new sap.ui.model.json.JSONModel(oFormData);
                    oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);

                    // Set models
                    this.getView().setModel(oFormModel, "formModel");
                    this._setActiveCard(null,"form", "/");

                }


            },

            initialize: async function () {
                this.setPageId();
                this.setFormTitle();
                this.setBackwardRoute('RouterNameInspectionFormBuilder');
                this.formMode = this.getFormMode();

                this.setEntryFormDataSourceURLToAddData('/odata/v4/inspection/MInspectionTypes');
                this.setEntryFormDataSourceURLToUpdateData('/odata/v4/inspection/MInspectionTypes(' + this.getListViewEditPropertyValue() + ')');

                if (this.formMode === FormMode.CREATE) {
                    const oFormModel = new JSONModel({
                        ID: this._generateGuid(),
                        name: "Untitled Form",
                        label: "Untitled Form",
                        approvalTemplate: { TemplateGuid: "" },
                        code: "",
                        version: 1,
                        isActive: true,
                        sections: []
                    });

                    oFormModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                    this.getView().setModel(oFormModel, "formModel");

                }
                // UI model
                const oUIModel = new sap.ui.model.json.JSONModel({
                    selectedType: "form",
                    activePath: "/"
                });

                // Set models
                this.getView().setModel(oUIModel, "uiModel");
                this._setActiveCard(null,"form", "/");


                this.getView().getModel("uiModel")
                    .setProperty("/activeCardId", this.createId("formCard"));

                this._updateActiveCardHighlight();

            },

            cflForApprovalTemplate: async function () {
                this.setCflTitle('Approval Template List');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/DTemplate',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Approval Code', 'Approval Name']);
                this.setCflDataColumns(['TemplateGuid', 'TemplateName']);
                this.setCflValueAndDisplay('/TemplateGuid', 'TemplateName', '', '');
                this.setCflSearchProperty('TemplateName');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/DTemplate', "", "value");

                this.showCfl(
                    'Template_Form',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onClosecflForApprovalTemplate.bind(this)
                );
            },

            onClosecflForApprovalTemplate: function () {
                const x = this.getCflObject();
                const formModelData = this.getView().getModel("formModel");
                formModelData.setProperty('/TemplateName', x.TemplateName);
                formModelData.setProperty('/approvalTemplate/TemplateGuid', x.TemplateGuid);
            },

            onChangeTemplate: function (oEvent) {
                var value = oEvent.getParameter("newValue");
                if (value) {
                    value = '';
                    var newValue = value
                    oEvent.getSource().setValue(newValue);
                }
            },

            _setInteractionSource: function (sType) {
                this._interactionSource = sType;

                setTimeout(() => {
                    this._interactionSource = null;
                }, 0);
            },

            _updateActiveCardHighlight: function () {
                const oUIModel = this.getView().getModel("uiModel");
                const sActiveId = oUIModel.getProperty("/activeCardId");

                // ✅ Get ALL Cards + GridListItems
                const aControls = this.getView().findAggregatedObjects(true, o =>
                    o.isA("sap.f.Card") || o.isA("sap.f.GridListItem")
                );

                aControls.forEach(oControl => {
                    if (oControl.getId() === sActiveId) {
                        oControl.addStyleClass("activeCard");
                        oControl.removeStyleClass("inActiveCard");
                    } else {
                        oControl.removeStyleClass("activeCard");
                        oControl.addStyleClass("inActiveCard");
                    }
                });
            },

            _setActiveCard: async function (oControl, sType, sPath) {

                const oUIModel = this.getView().getModel("uiModel");
                const oFormModel = this.getView().getModel("formModel");

                //  Safety check
                if (!oFormModel) {
                    console.warn("formModel not available yet, skipping _setActiveCard");
                    return;
                }

                //  Default fallback
                if (!sPath) {
                    sPath = "/";
                    sType = "form";
                }

                //  Store selection globally (IMPORTANT)
                oUIModel.setProperty("/selectedType", sType);
                oUIModel.setProperty("/activePath", sPath);

                //  Bind RIGHT PANEL only (DO NOT bind whole view)
                const oContext = oFormModel.createBindingContext(sPath);

                if (oContext) {
                    this.byId("rightPanelRoot").setBindingContext(oContext, "formModel");
                }


                if (oControl) {
                    oUIModel.setProperty("/activeCardId", oControl.getId());
                }


                //  Update side panel visibility
                await this._updateRightPanelVisibility();

                //  REMOVE THIS (not needed anymore)
                await this._updateActiveCardHighlight();
            },


            _updateRightPanelVisibility: function () {

                const sType = this.getView()
                    .getModel("uiModel")
                    .getProperty("/selectedType");

                const oForm = this.byId("formConfigBox");
                const oSection = this.byId("sectionConfigBox");
                const oField = this.byId("fieldConfigBox");
                const oTable = this.byId("tableConfigBox");
                const oColumn = this.byId("columnConfigBox");

                //  Hide all safely
                [oForm, oSection, oField, oTable, oColumn]
                    .forEach(o => o && o.setVisible(false));

                //  Show based on type
                switch (sType) {
                    case "form":
                        oForm && oForm.setVisible(true);
                        break;

                    case "section":
                        oSection && oSection.setVisible(true);
                        break;

                    case "field":
                        oField && oField.setVisible(true);
                        break;

                    case "column":
                        oColumn && oColumn.setVisible(true);
                        break;

                    case "table":
                        oTable && oTable.setVisible(true);
                        break;

                    default:
                        console.warn("⚠️ Unknown selectedType:", sType);
                        oForm && oForm.setVisible(true);
                }
            },

            onFormCardPress: function (oEvent) {

                const oUIModel = this.getView().getModel("uiModel");
                const oControl = oEvent.getSource();

                //  Set form as selected
                oUIModel.setProperty("/selectedType", "form");

                //  Root path (form level)
                oUIModel.setProperty("/activePath", "/");

                this._setActiveCard(oControl,"form", "/");

            },

            onSectionCardPress: function (oEvent) {

                if (["field", "column", "table"].includes(this._interactionSource)) return;
                this._setInteractionSource("section");

                const oSource = oEvent.getSource();
                const oCtx = oSource.getBindingContext("formModel");
                this._setActiveCard(oSource, "section", oCtx.getPath());
            },

            getSelectedClass: function (sSelected, sCurrent) {
                return sSelected === sCurrent
                    ? "gridCardItem selectedCard"
                    : "gridCardItem";
            },

            onDeleteSection: function (oEvent) {
                const oSource = oEvent.getSource();

                // Get the section context (VERY IMPORTANT)
                const oContext = oSource.getBindingContext("formModel");

                if (!oContext) {
                    console.error("No binding context found for deletion");
                    return;
                }

                const sPath = oContext.getPath();
                // Example: /sections/1

                const iIndex = parseInt(sPath.split("/")[2], 10);

                const oModel = this.getView().getModel("formModel");
                const aSections = oModel.getProperty("/sections");

                if (iIndex < 0 || iIndex >= aSections.length) {
                    console.error("Invalid section index");
                    return;
                }

                // Remove section
                aSections.splice(iIndex, 1);

                // Update model properly (DON’T just refresh blindly)
                oModel.setProperty("/sections", aSections);
                MessageToast.show("Section Deleted");
            },

            onPressAddSection: function () {
                const oModel = this.getView().getModel("formModel");
                const aSections = oModel.getProperty("/sections") || [];

                const oNewSection = {
                    ID: this._generateGuid(),
                    description: "Basic description",
                    name: "header",
                    renderType: "FORM",
                    sequenceNo: aSections.length + 1,
                    fields: [],
                    tables: [],
                    label: ""
                };

                const iNewIndex = aSections.length;
                oModel.setProperty("/sections", [...aSections, oNewSection]);

                //  ALWAYS activate via _setActiveCard
                this._setActiveCard(null,"section", `/sections/${iNewIndex}`);
            },

            onPressFieldCard: function (oEvent) {

                this._setInteractionSource("field");

                const oCtx = oEvent.getSource().getBindingContext("formModel");
                const oControl = oEvent.getSource();

                this._setActiveCard(oControl, "field", oCtx.getPath());
            },

            onPressAddField: function () {
                const oModel = this.getView().getModel("formModel");
                const oUIModel = this.getView().getModel("uiModel");

                const sActivePath = oUIModel.getProperty("/activePath");

                //  Must be inside a section
                const sectionMatch = sActivePath.match(/\/sections\/\d+/);
                if (!sectionMatch) {
                    MessageToast.show("Please Add at least one Section");
                    return;
                }

                const sSectionPath = sectionMatch[0];

                const aFields = oModel.getProperty(sSectionPath + "/fields") || [];
                const sDefaultInputType = "Input";
                const oNewField = {
                    ID: this._generateGuid(),
                    dataType: "String",
                    defaultValue: null,
                    inputType: sDefaultInputType,

                    metaData: (sDefaultInputType === "CFL" || sDefaultInputType === "DROPDOWN")
                        ? { api: "", key: "", value: "" }
                        : {},

                    isEditable: false,
                    isVisibleOnPrint: true,
                    isMandatory: false,
                    label: "New Field",
                    name: "newField",
                    sequenceNo: aFields.length + 1
                };

                const iNewIndex = aFields.length;
                oModel.setProperty(sSectionPath + "/fields", [...aFields, oNewField]);

                const sNewFieldPath = `${sSectionPath}/fields/${iNewIndex}`;

                //  ONLY ONE PLACE sets active state
                this._setActiveCard(null,"field", sNewFieldPath);
            },

            onInputTypeChange: function (oEvent) {
                const oSelect = oEvent.getSource();
                const sSelectedKey = oSelect.getSelectedKey();

                const oContext = oSelect.getBindingContext("formModel");
                const sPath = oContext.getPath();

                const oModel = this.getView().getModel("formModel");

                // update inputType
                oModel.setProperty(sPath + "/inputType", sSelectedKey);

                // handle metadata dynamically
                if (sSelectedKey === "CFL" || sSelectedKey === "DROPDOWN") {
                    oModel.setProperty(sPath + "/metaData", {
                        api: "",
                        key: "",
                        value: ""
                    });
                } else {
                    oModel.setProperty(sPath + "/metaData", {});
                }
            },

            onPressDeleteField: async function (oEvent) {
                const oSource = oEvent.getSource();

                // Get field binding context
                const oContext = oSource.getBindingContext("formModel");
                if (!oContext) {
                    console.error("No binding context found for field deletion");
                    return;
                }

                const sPath = oContext.getPath();
                // Example: /sections/1/fields/2

                const aParts = sPath.split("/");
                if (aParts.length < 5) {
                    console.error("Invalid field path:", sPath);
                    return;
                }

                const iSectionIndex = parseInt(aParts[2], 10);
                const iFieldIndex = parseInt(aParts[4], 10);

                const oModel = this.getView().getModel("formModel");
                const aSections = oModel.getProperty("/sections");

                if (
                    isNaN(iSectionIndex) ||
                    isNaN(iFieldIndex) ||
                    !aSections[iSectionIndex] ||
                    !aSections[iSectionIndex].fields
                ) {
                    console.error("Invalid section or field index");
                    return;
                }

                // Remove field
                aSections[iSectionIndex].fields.splice(iFieldIndex, 1);

                // Recalculate sequenceNo (important difference from table)
                aSections[iSectionIndex].fields =
                    aSections[iSectionIndex].fields.map((f, index) => ({
                        ...f,
                        sequenceNo: index + 1
                    }));

                // Update model
                oModel.setProperty("/sections", aSections);

                // Optional: reset selection to section
                const oUIModel = this.getView().getModel("uiModel");
                oUIModel.setProperty("/selectedType", "section");
                oUIModel.setProperty("/activePath", `/sections/${iSectionIndex}`);

                MessageToast.show("Field Deleted");
            },

            onPressTableCard: function (oEvent) {


                if (this._interactionSource === "column") return;

                this._setInteractionSource("table");

                const oCtx = oEvent.getSource().getBindingContext("formModel");
                const oControl = oEvent.getSource();

                this._setActiveCard(oControl, "table", oCtx.getPath());

            },

            onPressAddTable: function () {
                const oModel = this.getView().getModel("formModel");
                const oUIModel = this.getView().getModel("uiModel");

                const sActivePath = oUIModel.getProperty("/activePath");

                // Must be inside a section
                const sectionMatch = sActivePath.match(/\/sections\/\d+/);
                if (!sectionMatch) {
                    MessageToast.show("Please Add at least one Section");
                    return;
                }

                const sSectionPath = sectionMatch[0];

                const aTables = oModel.getProperty(sSectionPath + "/tables") || [];
                const sDefaultInputType = "Input";
                const oNewTable = {
                    ID: this._generateGuid(),
                    name: "New Data Table",
                    allowAddRow: true,
                    allowDeleteRow: true,
                    allowEditRow: true,
                    minRows: 0,
                    maxRows: null,
                    columns: [
                        {
                            ID: this._generateGuid(),
                            dataType: "String",
                            inputType: sDefaultInputType,
                            metaData: sDefaultInputType === "CFL" || sDefaultInputType === "DROPDOWN"
                                ? { api: "", key: "", value: "" }
                                : {},
                            label: "SrNo",
                            name: "ROWNUMBER",
                            sequenceNo: 1,
                            isMandatory: false,
                            isEditable: false,
                            isVisibleOnPrint: true,
                        }
                    ]
                };

                const iNewIndex = aTables.length;

                oModel.setProperty(
                    sSectionPath + "/tables",
                    [...aTables, oNewTable]
                );

                const sNewTablePath = `${sSectionPath}/tables/${iNewIndex}`;

                // SINGLE place to control active state
                this._setActiveCard(null,"table", sNewTablePath);
            },

            onPressDeleteTable: function (oEvent) {
                const oSource = oEvent.getSource();

                // Get table binding context
                const oContext = oSource.getBindingContext("formModel");
                if (!oContext) {
                    console.error("No binding context found for table deletion");
                    return;
                }

                const sPath = oContext.getPath();
                // Example: /sections/1/tables/2

                const aParts = sPath.split("/");
                if (aParts.length < 5) {
                    console.error("Invalid table path:", sPath);
                    return;
                }

                const iSectionIndex = parseInt(aParts[2], 10);
                const iTableIndex = parseInt(aParts[4], 10);

                const oModel = this.getView().getModel("formModel");
                const aSections = oModel.getProperty("/sections");

                if (
                    isNaN(iSectionIndex) ||
                    isNaN(iTableIndex) ||
                    !aSections[iSectionIndex] ||
                    !aSections[iSectionIndex].tables
                ) {
                    console.error("Invalid section or table index");
                    return;
                }

                // Remove table
                aSections[iSectionIndex].tables.splice(iTableIndex, 1);

                // Update model (important!)
                oModel.setProperty("/sections", aSections);

                // Optional: reset active selection
                const oUIModel = this.getView().getModel("uiModel");
                oUIModel.setProperty("/selectedType", "section");
                oUIModel.setProperty(
                    "/activePath",
                    `/sections/${iSectionIndex}`
                );

                MessageToast.show("Table Deleted");
            },

            onPressColumn: function (oEvent) {
                this._setInteractionSource("column");

                const oCtx = oEvent.getSource().getBindingContext("formModel");
                const oControl = oEvent.getSource();
                this._setActiveCard(oControl, "column", oCtx.getPath());


            },

            onPressAddColumn: function () {
                const oView = this.getView();
                const oModel = oView.getModel("formModel");
                const oUIModel = oView.getModel("uiModel");

                const sActivePath = oUIModel.getProperty("/activePath");

                // Must be inside a TABLE
                const tableMatch = sActivePath.match(/\/sections\/\d+\/tables\/\d+/);
                if (!tableMatch) {
                    MessageToast.show("Please select a table first");
                    return;
                }

                const sTablePath = tableMatch[0];
                const aColumns = oModel.getProperty(sTablePath + "/columns") || [];

                const iIndex = aColumns.length + 1;
                const sDefaultInputType = "Input";

                const oNewColumn = {
                    ID: this._generateGuid(),
                    dataType: "String",
                    inputType: "Input",
                    label: "Column " + iIndex,
                    name: "col" + iIndex,
                    sequenceNo: iIndex,
                    isEditable: false,
                    isVisibleOnPrint: true,
                    isMandatory: false,
                    metaData: sDefaultInputType === "CFL" || sDefaultInputType === "DROPDOWN"
                        ? { api: "", key: "", value: "" }
                        : {},
                };

                // Update Model (Tokenizer auto updates)
                oModel.setProperty(
                    sTablePath + "/columns",
                    [...aColumns, oNewColumn]
                );

                // Set active column
                const sNewColPath = sTablePath + "/columns/" + aColumns.length;
                this._setActiveCard(null,"column", sNewColPath);

                MessageToast.show("Column added");
            },

            onPressDeleteColumn: function (oEvent) {
                const oToken = oEvent.getSource();
                const oCtx = oToken.getBindingContext("formModel");

                const sColPath = oCtx.getPath();
                const sColsPath = sColPath.substring(0, sColPath.lastIndexOf("/"));

                const oModel = this.getView().getModel("formModel");
                const aCols = oModel.getProperty(sColsPath);

                const iIndex = parseInt(sColPath.split("/").pop(), 10);
                aCols.splice(iIndex, 1);

                oModel.setProperty(sColsPath, aCols);
                this._setActiveCard(null,"table", sColsPath.replace("/columns", ""));

                MessageToast.show("Column removed");
            },

            onLiveChangeForInput: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oSource = oEvent.getSource();
                const sProperty = oSource.data("property");

                if (!sProperty) return;

                const sFinalValue = sValue ? this._toObjectKey?.(sValue) || sValue : "";
                this._updateByProperty(sProperty, sFinalValue);
            },

            onLiveChangeForNormalCase: function (oEvent) {
                const sValue = oEvent.getParameter("value");
                const oSource = oEvent.getSource();
                const sProperty = oSource.data("property");

                if (!sProperty) return;

                const sFinalValue = sValue ? sValue : "";
                this._updateByProperty(sProperty, sFinalValue);
            },

            _updateByProperty: function (sProperty, vValue) {
                const oView = this.getView();
                const oUIModel = oView.getModel("uiModel");
                const oFormModel = oView.getModel("formModel");

                const sActivePath = oUIModel.getProperty("/activePath");
                if (!sActivePath) return;

                const sTargetPath =
                    sActivePath === "/"
                        ? "/" + sProperty
                        : sActivePath + "/" + sProperty;

                oFormModel.setProperty(sTargetPath, vValue);
            },

            _toObjectKey: function (sText) {
                return sText
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9 ]/g, "")          // remove special chars
                    .replace(/\s+(.)/g, (_, c) => c.toUpperCase()) // camelCase
                    .replace(/\s/g, "");
            },

            _toCamelCase: function (str) {
                return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
            },

            _generateGuid: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },

            onPressBack: function () {
                this.onPressOfEntryFormCancelButton();
            },

            isFormValid: function () {
                let isValid = true;

                const y = this.getView().getModel("formModel");
                if (y.oData.code == null || y.oData.code == "") {
                    isValid = false;
                    MessageToast.show("Please Enter Template Code !")
                }

                return isValid;
            },

            onSave: async function () {
                if (this.isFormValid()) {
                    const modelData = this.getView().getModel("formModel").getData();

                    modelData.sections?.forEach(section => {

                        // fields (multiple)
                        section.fields?.forEach(field => {
                            if (field.metaData && typeof field.metaData === "object") {
                                field.metaData = JSON.stringify(field.metaData);
                            }
                        });

                        // tables (multiple)
                        section.tables?.forEach(table => {

                            // columns (multiple)
                            table.columns?.forEach(column => {
                                if (column.metaData && typeof column.metaData === "object") {
                                    column.metaData = JSON.stringify(column.metaData);
                                }
                            });

                        });

                    });

                    delete modelData.TemplateName;
                    delete modelData.isEditable;
                    delete modelData.isVisibleOnPrint;
                    delete modelData.isMandatory;

                    await this.onPressOfEntryFormSaveButton(modelData);

                    const res = this.getApiResponseObject();
                    if (res.success === true) {
                        if (this.formMode === FormMode.CREATE) {
                            MessageToast.show('Form Builder added successfully');
                        } else {
                            MessageToast.show('Form Builder updated successfully');
                        }
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            2000
                        );
                    } else {
                        MessageToast.show(res.object.responseJSON.error.message);
                    }
                }
            },

            _getGeneratedJSON: function () {
                const oModel = this.getView().getModel("formModel");
                const oData = oModel.getData();

                const oCleanData = JSON.parse(JSON.stringify(oData));

                //  Validation
                const aErrors = [];

                oCleanData.sections.forEach((section, sIndex) => {
                    if (!section.name) {
                        aErrors.push(`Section ${sIndex + 1} has no name`);
                    }

                    (section.fields || []).forEach((field, fIndex) => {
                        if (!field.name) {
                            aErrors.push(`Field ${fIndex + 1} in Section ${sIndex + 1} missing 'name'`);
                        }
                        if (!field.inputType) {
                            aErrors.push(`Field ${fIndex + 1} in Section ${sIndex + 1} missing 'inputType'`);
                        }
                    });
                });

                if (aErrors.length > 0) {
                    MessageToast.error(aErrors.join("\n"));
                    return;
                }

                //  Beautified JSON
                const sJSON = JSON.stringify(oCleanData, null, 2);
                this._generatedJSON = sJSON;

                //  Show popup with actions
                this._openJSONDialog(sJSON);
            },

            _openJSONDialog: function (sJSON) {
                if (!this._oJSONDialog) {

                    this._oJSONDialog = new sap.m.Dialog({
                        title: "Generated JSON",
                        contentWidth: "800px",
                        contentHeight: "600px",
                        resizable: true,
                        draggable: true,
                        content: [
                            new TextArea("jsonTextArea", {
                                width: "100%",
                                height: "100%",
                                editable: false,
                                growing: true,
                                growingMaxLines: 50
                            })
                        ],

                        buttons: [
                            new Button({
                                text: "Copy",
                                press: () => this._copyJSON()
                            }),
                            new Button({
                                text: "Download",
                                press: () => this._downloadJSON()
                            }),
                            new Button({
                                text: "Close",
                                press: () => this._oJSONDialog.close()
                            })
                        ]
                    });

                    this.getView().addDependent(this._oJSONDialog);
                }

                sap.ui.getCore().byId("jsonTextArea").setValue(sJSON);
                this._oJSONDialog.open();
            },

            _copyJSON: function () {
                const sJSON = this._generatedJSON;

                if (!sJSON) return;

                navigator.clipboard.writeText(sJSON)
                    .then(() => {
                        MessageToast.show("JSON copied to clipboard");
                    })
                    .catch(() => {
                        MessageToast.show("Copy failed");
                    });
            },

            _downloadJSON: function () {
                const sJSON = this._generatedJSON;

                if (!sJSON) return;

                const blob = new Blob([sJSON], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = "form-config.json";
                a.click();

                URL.revokeObjectURL(url);

                MessageToast.show("JSON downloaded");
            },

            _reorderArray: function (aArray, iDragIndex, iDropIndex) {
                const oItem = aArray.splice(iDragIndex, 1)[0];
                aArray.splice(iDropIndex, 0, oItem);
                return aArray;
            },

            onDropSection: function (oEvent) {
                const oModel = this.getView().getModel("formModel");

                const sPath = "/sections";
                let aSections = oModel.getProperty(sPath);

                const oDragged = oEvent.getParameter("draggedControl");
                const oDropped = oEvent.getParameter("droppedControl");

                const iDragIndex = oDragged.getParent().indexOfItem(oDragged);
                const iDropIndex = oDropped.getParent().indexOfItem(oDropped);

                const aNew = this._reorderArray(aSections, iDragIndex, iDropIndex);

                //  Sequence fix
                aNew.forEach((item, i) => item.sequence = i + 1);

                oModel.setProperty(sPath, aNew);
            },


            onDropField: function (oEvent) {
                const oModel = this.getView().getModel("formModel");

                const oDragged = oEvent.getParameter("draggedControl");
                const oDropped = oEvent.getParameter("droppedControl");

                //  Get section path
                const sPath = oDragged.getBindingContext("formModel").getPath().split("/fields")[0];

                let aFields = oModel.getProperty(sPath + "/fields");

                //  Get indexes (same pattern as Section)
                const iDragIndex = oDragged.getParent().indexOfItem(oDragged);
                const iDropIndex = oDropped.getParent().indexOfItem(oDropped);

                //  Reorder using common function
                const aNew = this._reorderArray(aFields, iDragIndex, iDropIndex);

                //  Sequence fix
                aNew.forEach((item, i) => item.sequenceNo = i + 1);

                //  Update model
                oModel.setProperty(sPath + "/fields", aNew);
            },

            onDropTable: function (oEvent) {

                const oModel = this.getView().getModel("formModel");

                const oDragged = oEvent.getParameter("draggedControl");
                const oDropped = oEvent.getParameter("droppedControl");

                //  Get section path
                const sPath = oDragged.getBindingContext("formModel").getPath().split("/tables")[0];

                let aTables = oModel.getProperty(sPath + "/tables");

                //  Get indexes (same pattern everywhere)
                const iDragIndex = oDragged.getParent().indexOfItem(oDragged);
                const iDropIndex = oDropped.getParent().indexOfItem(oDropped);

                //  Reorder using common function
                const aNew = this._reorderArray(aTables, iDragIndex, iDropIndex);

                //  Sequence fix
                aNew.forEach((item, i) => item.sequenceNo = i + 1);

                //  Update model
                oModel.setProperty(sPath + "/tables", aNew);
            },

            onDropColumn: function (oEvent) {

                const oModel = this.getView().getModel("formModel");

                const oDragged = oEvent.getParameter("draggedControl");
                const oDropped = oEvent.getParameter("droppedControl");

                //  Get table path
                const sPath = oDragged.getBindingContext("formModel").getPath().split("/columns")[0];

                let aColumns = oModel.getProperty(sPath + "/columns");

                //  Get indexes (same standard pattern)
                const iDragIndex = oDragged.getParent().indexOfItem(oDragged);
                const iDropIndex = oDropped.getParent().indexOfItem(oDropped);

                //  Reorder using common function
                const aNew = this._reorderArray(aColumns, iDragIndex, iDropIndex);

                //  Sequence fix
                aNew.forEach((item, i) => item.sequenceNo = i + 1);

                //  Update model
                oModel.setProperty(sPath + "/columns", aNew);
            },
        })
    },

);