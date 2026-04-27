sap.ui.define([
    "core/generic/genericentryform",
    "./SeekAdviceCommentDialog.controller",


    "./ApproveRejectFragment.controller",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    'sap/ui/core/routing/History',
    "sap/m/Image",
    "sap/m/PDFViewer",
    "sap/ui/model/json/JSONModel",
    "stoneman/modone/model/formatter",
    "sap/ui/core/format/DateFormat",
],
    function (genericentryform, SeekAdviceCommentDialog, ApproveRejectFragment, MessageToast, Dialog, History, Image, PDFViewer, JSONModel, formatter, DateFormat) {
        "use strict";

        let irowIndex = 0;
        let _oSelectedRowContext = null;
        let absIDMainAssembly = '';
        let absIDSubAssembly = [];
        let absIDChildAssembly = [];
        let absIDSeekAdvice = [];
        let _aBase64Files = [];
        let _aBase64FilesMainAssembly = [];
        let _aBase64FilesSubAssembly = [];
        let _aBase64FilesChildAssembly = [];
        let _aBase64FilesSeekAdvice = [];
        let AttachmentDataSingle = [];
        let _fileData = [];
        var _fileDataSub = [];
        var _fileDataChild = [];
        let _fileDataSeek = [];
        let _fileDataAttachment = [{}];
        let oSelectDiamension;
        let oSelectDiameter;

        let role;
        let loginInfo;
        let enableDisableArrayForBtn = [];
        let myName;
        let sstageCode;
        let FileTypesConfig = {
            allowedFileTypes: [
                'jpeg',
                'jpg',
                'png',
                'pdf',
                'xls',
                'xlsx',
                'ppt',
                'pptx',
                'doc',
                'docx',
                'eml',
                'msg',
                'txt',
                'stl',
                'dxf',
                'plt',
                'hpgl',
                'cdr',
                'STL',
                'IGS',
                'dwg',
                'stp',
                'PNG'
            ]
        };

        return genericentryform.extend("moduleonecontroller.caddetailentryform", {
            constructor: function () {
                // Initialize properties here

                this.irowIndex = 0;
                this._oSelectedRowContext = null;
                this.absIDMainAssembly = '';
                this.absIDSubAssembly = [];
                this.absIDChildAssembly = [];
                this.absIDSeekAdvice = [];
                this._aBase64Files = [];
                this._aBase64FileSingle = [];
                this._aBase64FilesMainAssembly = [];
                this._aBase64FilesSubAssembly = [];
                this._aBase64FilesChildAssembly = [];
                this._aBase64FilesSeekAdvice = [];
                this._fileData = [];
                this._fileDataChild = [];
                this._fileDataSub = [];
                this._fileDataSeek = [];
                this._fileDataAttachment = []; // Initialize as an empty array
                this.guid = null;
                this.FGQuantity = null;
            },
            onInit: function () {

                genericentryform.prototype.onInit.apply(this, arguments);
                //this.loadFragments(["CADDetailHeader", "CADDetailDimensions", "CADDetailAttachment", "CADDetailMainAssembly", "CADDetailSubAssembly", "CADDetailChildAssembly", "CADDetailSeekAdvice", "CADDetailProgress"]);

            },
            onPressLogout: function () {
                var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
                oStorage.put(null);
                sap.ui.getCore().getEventBus().publish("Logout", "rowSelectEvent", '');
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteLogin", {}, true);
            },

            initialize: async function () {

                this.setPageId("caddetailef");
                this.setFormTitle("CAD Detail Entry Form");
                this.setBackwardRoute("RouterNameCADDetailListView_new");
                console.log("Edit Value =================================> ", this.getListViewEditPropertyValue())
                this.setEntryFormDataSourceURLToAddData("/odata/v4/stoneman-cad/TCadDetail");
                this.setEntryFormDataSourceURLToUpdateData("/odata/v4/stoneman-cad/TCadDetail(" + this.getListViewEditPropertyValue() + ")");

                let oPath2 = jQuery.sap.getModulePath(
                    "stoneman",
                    "/modone/model/CADDetailSaveRequest.json",
                );
                let oModel2 = new sap.ui.model.json.JSONModel(oPath2);
                this.getView().setModel(oModel2, "saverequest");

                this.absIDMainAssembly = '';
                this.absIDSubAssembly = [];
                this.absIDChildAssembly = [];
                this.absIDSeekAdvice = [];
                this._aBase64Files = [];
                this._aBase64FilesMainAssembly = [];
                this._aBase64FilesSubAssembly = [];
                this._aBase64FilesChildAssembly = [];
                this._aBase64FilesSeekAdvice = [];
                this._fileData = [{}];
                this._fileDataChild = [{}];
                this._fileDataSub = [];
                this._fileDataSeek = [{}];
                this._fileDataAttachment = [{}];


                loginInfo = this.getLoginInfo();
                role = this.getRoleDetails();
                console.log("==============================================================================>", loginInfo)
                myName = loginInfo['Username'];
                var oViewModel = new JSONModel({ myName: myName });
                this.getView().setModel(oViewModel, "view");

                let oPathAttachment = jQuery.sap.getModulePath('stoneman', '/modone/model/Attachment.json');
                let oModelAttachment = new sap.ui.model.json.JSONModel(oPathAttachment);
                this.getView().setModel(oModelAttachment, 'AttachModel');

                let oPathMainProductImage = jQuery.sap.getModulePath('stoneman', '/modone/model/MainProductImage.json');
                let oModelMainProductImage = new sap.ui.model.json.JSONModel(oPathMainProductImage);
                this.getView().setModel(oModelMainProductImage, 'MainProductImageModel');


                // if (role.RoleCode == 'DTP_HEAD') {
                //     this.byId("caddetail_CAD_btnApprove").setVisible(true);
                //     this.byId("caddetail_CAD_btnReject").setVisible(true);
                //     this.byId("caddetail_btnSave").setVisible(false);
                //     this.byId("caddetail_btnSubmit").setVisible(false);
                //     this.byId("caddetail_cadReqNo").setEnabled(false);
                //     this.byId("caddetail_caddetailefdtpheadname").setEnabled(false);
                // }
                // if (role.RoleCode == 'DTP_ASSISTANT') {
                //     this.byId("caddetail_CAD_btnApprove").setVisible(false);
                //     this.byId("caddetail_CAD_btnReject").setVisible(false);
                //     this.byId("caddetail_btnSave").setVisible(true);
                //     this.byId("caddetail_btnSubmit").setVisible(true);
                //     this.byId("caddetail_cadReqNo").setEnabled(true);
                //     // this.byId("caddetail_caddetailefdtpheadname").setEnabled(true);
                // }
                if (this.getFormMode() == "3") {
                    let oPath = jQuery.sap.getModulePath(
                        "stoneman",
                        "/modone/model/CADDetailAddViewNew.json",
                    );
                    let oModel = new sap.ui.model.json.JSONModel(oPath);
                    this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
                    await this.getStagefieldsAPI();
                    // this.setDataForDTPAssistant();

                }


                let oObjectPageLayout = this.byId('CadDetailHeaderObject');
                let oSection = this.byId('CadDetailHeaderSelect');
                oObjectPageLayout.setSelectedSection(oSection);

                const aScrollContainerIds = ['scrollDiaCADDetail', 'scrollCADAttach', 'caddetail_scrollcontainerMain', 'caddetail_scrollcontainerSub', 'caddetail_scrollcontainerChild', 'scrollCADDetailSeek', 'caddetail_scrollcontainer-seek'];
                aScrollContainerIds.forEach(id => {
                    const oScrollContainer = this.getView().byId(id); // Get the ScrollContainer by ID
                    if (oScrollContainer) {
                        const oDomRef = oScrollContainer.getDomRef(); // Get the DOM reference of the container
                        if (oDomRef) {
                            // Apply min and max height dynamically to each container
                            oDomRef.style.minHeight = 'auto';
                            oDomRef.style.maxHeight = '300px';
                            oDomRef.style.overflow = 'auto'; // Ensure scrolling
                        }
                    }
                });


            },
            onAddProcess: function (oEvent) {
                var oTable = this.byId("caddetail_childAssemblyTree");
                var oCtx = oEvent.getSource().getBindingContext("EntryFormDataSourceModel");
                var oParent = oCtx.getObject();

                if (!oParent.ChildProcess) {
                    oParent.ChildProcess = [];
                }

                oParent.ChildProcess.push({
                    ProcessName: null,
                    ProcessCode: null,
                    IsParent: false,
                    Process_ProcessUUID: null,
                    Details: []
                });

                oCtx.getModel().refresh(true);

                // --- EXPAND the correct parent node ---
                var oBinding = oTable.getBinding("rows");
                var sCtxPath = oCtx.getPath(); // e.g. /MainAssembly/0/ChildAssembly/1

                // Get all row contexts from the binding (use full length)
                var iLength = oBinding.getLength ? oBinding.getLength() : 500; // fallback
                var aContexts = oBinding.getContexts(0, iLength);

                // Find the index for this context
                var iRowIndex = aContexts.findIndex(function (ctx) {
                    return ctx && ctx.getPath && ctx.getPath() === sCtxPath;
                });

                if (iRowIndex > -1) {
                    oTable.expand(iRowIndex);
                } else {
                    console.warn("Could not find row index for path:", sCtxPath);
                }
            },

            onBeforeShow: async function (oEvent) {
                this.identifyFormMode(oEvent);
                this.initialize();
                this.setEntryFormDataSourceURLForEditMode("/odata/v4/stoneman-cad/TCadDetail(" + this.getListViewEditPropertyValue() + ")?$expand=Team,MainAttachment($expand=Attachment),InspDraw($expand=Attachment,User($expand=Role)),ApprovalTransaction($expand=DataFlow($expand=User)),SeekAdvice($expand=Role,Attachment),Material,ProductSubCat,MainAssembly($expand=ChildAssembly($expand=ChildProcess($expand=Details))),Assembly,ImportedAccessory");

                await this.showEntryForm();
                if (this.getFormMode() == "2") {
                    await this.getEditDataCadDetail();
                    this.byId('caddetail_cadReqNo').setEnabled(false);
                    // this.setDataForDTPAssistant();
                    this.setProcessHistoryDisplayDataFormat();
                } else {
                    this.byId('caddetail_cadReqNo').setEnabled(true);
                    let main = { 'node': [] }
                    var oModel = new JSONModel(main);
                    this.getView().setModel(oModel, 'testdata');
                }

                let model = this.getView().getModel(this.getEntryFormDataSourceModelName());

                // Get the current MainAssembly value
                let currentAssembly = model.getProperty("/MainAssembly");

                // Only set if it's empty or not defined
                if (!currentAssembly || currentAssembly.length === 0) {
                    let oMainAssembly = [
                        {
                            "ProductNo": null,
                            "ProductName": null,
                            "Quantity": null,
                            "Remarks": null,
                            "Weight": null,
                            "WeightUOMCode": null,
                            "SCIPLCode": null,
                            "PDNumber": null,
                            "ChildAssembly": []
                        }
                    ];

                    model.setProperty("/MainAssembly", oMainAssembly);
                }

                let Assembly = model.getProperty("/Assembly");
                if (!Assembly || Assembly.length === 0) {
                    let oAssembly = [
                        {
                            "ItemCode": null,
                            "ItemName": null

                        }
                    ];
                    model.setProperty("/Assembly", oAssembly);
                }

                let ImportedAccessory = model.getProperty("/ImportedAccessory");
                if (!ImportedAccessory || ImportedAccessory.length === 0) {
                    let oImportedAccessory = [
                        {
                            "ItemCode": null,
                            "ItemName": null,
                            "Cost": null

                        }
                    ];
                    model.setProperty("/ImportedAccessory", oImportedAccessory);
                }
                await this.onDimensionOrModelChange(model);
                // await this.onDimensionOrModelChange(model);


                // if (role.RoleCode == "DTP_ASSISTANT") {
                //     model.setProperty("/DTPAssitantName", loginInfo.Username);
                //     model.setProperty("/DTPAssitant_UserGuid", loginInfo.UserID);
                // }
                let oLoginUser = this.getLoginInfo();
                if (role.RoleCode === "DTP_HEAD") {
                    let oCadModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    oCadModel.setProperty("/CreatedByUserID_UserGuid", role.UserID);

                    let oCadData = oCadModel.getData();

                    if (!oCadData.Team) {
                        oCadData.Team = [];
                    }

                    // check if user is already in team
                    let bAlreadyInTeam = oCadData.Team.some(member => member.User_UserGuid === oLoginUser.UserID);
                    if (!bAlreadyInTeam) {
                        let oNewTeamMember = {
                            DelMark: 0,
                            ProductCatGuid_ProductCategoryGuid: oCadData.ProductCatGuid_ProductCategoryGuid,
                            ProductCategoryCode: oCadData.ProductCatCode || "",
                            ProductCategoryName: oCadData.ProductCatName || "",
                            RoleCode: "DTP_HEAD",
                            RoleGuid_RoleGuid: oLoginUser.RoleGuid,
                            RoleName: "DTP Head",
                            RowNumber: oCadData.Team.length + 1,
                            UserMaterialCategoryCode: oCadData.MCatCode,
                            UserMaterialCategoryName: oCadData.MCatName,
                            UserName: oLoginUser.Username,
                            User_UserGuid: oLoginUser.UserID
                        };

                        oCadData.Team.push(oNewTeamMember);
                        oCadModel.refresh(true);

                        sap.m.MessageToast.show("DTP Head added to Team: " + oLoginUser.Username);
                    }
                }
                model.setProperty("/loginUserID_UserGuid", role.UserID);

                var sampleData = {
                    "ReqTypArray": [
                        {
                            "id": "N",
                            "name": "New"
                        },
                        {
                            "id": "R",
                            "name": "Repeat"
                        }
                    ],
                    "CRFCATArray": [
                        {
                            "id": "CAD",
                            "name": "CAD"
                        },
                        {
                            "id": "Rendering",
                            "name": "Rendering"
                        }
                    ],

                    "lblType": [
                        {
                            "id": "decor",
                            "name": "Decor"
                        },
                        {
                            "id": "furnishing",
                            "name": "Furniture"
                        }
                    ],
                    "inputTypeArray": [
                        {
                            "id": "INPUT1",
                            "name": "Internal"
                        },
                        {
                            "id": "INPUT2",
                            "name": "External"
                        }
                    ], "processJobWorkRate": [
                        {
                            "id": "EASY",
                            "name": "Easy"

                        }, {
                            "id": "MEDIUM",
                            "name": "Medium"

                        }, {
                            "id": "CRITICAL",
                            "name": "Critical"

                        }
                    ]
                };
                this.createNewModelUsingArray("ReqTypeModel", sampleData);
                this.populateSelect("caddetail_reqType", "ReqTypeModel", "ReqTypArray", "id", "name");

                let p = {
                    Lighting: false
                }
                var oModel1 = new sap.ui.model.json.JSONModel(p);
                oModel1 = this.getView().setModel(oModel1, 'EnableCheck');

                this.onCategoryChange();

            },

            setProcessHistoryDisplayDataFormat: function () {
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = oViewModel.getData();
                let filteredData = data.ApprovalTransaction.filter(function (item) {
                    return item.RowNumber !== 0;
                });
                let node = [];
                filteredData.forEach(element => {
                    let innerArr = element.DataFlow.map(ele => ({
                        name: ele.User.UserName,
                        role: ele.User.UserRoleCode,
                        startdate: ele.StartDate == null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(ele.StartDate),
                        enddate: ele.EndDate == null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(ele.EndDate),
                        comment: ele.Remarks,
                        taskstatus: ele.ApprovalStatus == 'NA' ? null : ele.ApprovalStatus,
                        completionstatus: element.RowStatus,
                        nature: element.Type
                    }));
                    // Optional: sort inner nodes if needed
                    innerArr.sort((a, b) => a.name.localeCompare(b.name));

                    node.push({
                        rowNumber: Number(element.RowNumber), // numeric
                        name: element.StageCode,
                        role: null,
                        startdate: element.startDte,
                        enddate: element.endDte,
                        comment: element.Remarks,
                        taskstatus: element.ApprovalStatus == 'NA' ? null : element.ApprovalStatus,
                        completionstatus: element.RowStatus,
                        nature: element.Type,
                        node: innerArr
                    });
                });

                // Sort top-level nodes by rowNumber
                node.sort((a, b) => a.rowNumber - b.rowNumber);

                this.getView().setModel(new JSONModel({ node: node }), 'testdata');

            },

            setDataForDTPAssistant: function () {
                let model = this.getView().getModel(this.getEntryFormDataSourceModelName());

                if (role.RoleCode == "DTP_ASSISTANT") {

                    model.setProperty("/DTPAssitantName", loginInfo.Username);
                    model.setProperty("/DTPAssitant_UserGuid", loginInfo.UserID);
                    model.setProperty("/CreatedByUserID_UserGuid", role.UserID);
                }
                model.setProperty("/loginUserID_UserGuid", role.UserID);
            },
            onNavBack: function () {
                const oHistory = History.getInstance()
                const sPreviousHash = oHistory.getPreviousHash()

                if (sPreviousHash !== undefined) {
                    window.history.go(-1)
                } else {
                    const oRouter = this.getOwnerComponent().getRouter()
                    oRouter.navTo(this.getBackwardRoute(), {}, true)
                }
            },

            getEditDataCadDetail: async function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aData = oModel.getData();
                let PCategory = oModel.getProperty("/Category");

                if (PCategory == "Lighting") {

                    let y = {
                        Lighting: true
                    }
                    var oModel1 = new sap.ui.model.json.JSONModel(y);
                    oModel1 = this.getView().setModel(oModel1, 'EnableCheck');

                } else {

                    let y = {
                        Lighting: false
                    }
                    var oModel1 = new sap.ui.model.json.JSONModel(y);
                    oModel1 = this.getView().setModel(oModel1, 'EnableCheck');
                }

                aData.Material.forEach(function (item, index = 0) {
                    item.srNo = index + 1;
                })

                aData.InspDraw.forEach(function (item, index = 0) {
                    item.srNo = index + 1;
                    item.RowNumber = index + 1;
                    item.isDownloadVisible = true;
                })
                aData.Team.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                })
                aData.SeekAdvice.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                })

                aData.MainAssembly.forEach(function (element, index) {
                    element.srNo = index + 1;
                    element.RowNumber = index + 1;
                    element.isNewRow = false;
                    element.isDownloadVisibleMain = true;
                })
                // aData.SubAssembly.forEach(function (element, index) {
                //     element.srNo = index + 1;
                //     element.RowNumber = index + 1;
                //     element.isNewRow = false;
                //     element.isDownloadVisibleSub = true;
                // })
                // aData.ChildAssembly.forEach(function (element, index) {
                //     element.srNo = index + 1;
                //     element.RowNumber = index + 1;
                //     element.isNewRow = false;
                //     element.isDownloadVisibleChild = true;
                // })

                aData.ApprovalTransaction.forEach(function (item, index = 0) {
                    item.ProcessDte = item.ProcessDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.ProcessDate);
                    item.StartDte = item.StartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.StartDate);
                    item.EndDte = item.EndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.EndDate);
                    // item.RowNumber = index + 1;
                })
                this.showHideViewBtn(aData);
                this.getTemplateDataForEnableDisable();
                oModel.setData(aData);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());


            },

            showHideViewBtn: function (data) {
                data.SeekAdvice.forEach(function (item) {
                    if (item.SeekAdviceDocAbsId_AbsId !== null) {
                        item.isDownloadVisibleSeek = true;
                    } else {
                        item.isDownloadVisibleSeek = false;
                    }
                });
                data.MainAssembly.forEach(function (element) {
                    if (element.AssemblyCadAttachment_AbsId !== null) {
                        element.isDownloadVisibleMain = true;
                    } else {
                        element.isDownloadVisibleMain = false;
                    }

                })
                // data.SubAssembly.forEach(function (element) {
                //     if (element.AssemblyCadAttachment_AbsId !== null) {
                //         element.isDownloadVisibleSub = true;
                //     } else {
                //         element.isDownloadVisibleSub = false;
                //     }

                // })
                // data.ChildAssembly.forEach(function (element) {
                //     if (element.AssemblyCadAttachment_AbsId !== null) {
                //         element.isDownloadVisibleChild = true;
                //     } else {
                //         element.isDownloadVisibleChild = false;
                //     }

                // })

                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setData(data);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
            },

            getStagefieldsAPI: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MStage", "", "myModel");
                let myModel = this.getView().getModel("myModel").getData();
                let model = this.getView().getModel(this.getEntryFormDataSourceModelName());
                model.setProperty("/CrfStageCode_StageGuid", myModel.value[0].StageCode_StageConstant);
                model.setProperty("/CrfStageName", myModel.value[0].StageName);
                // model.setProperty("/CreatedByUserID_UserID", loginInfo.UserID);
                // sstageCode = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/CrfStageCode_StageCode_StageConstant');
                this.getTemplateDataForEnableDisable();

            },
            getTemplateDataForEnableDisable: async function () {

                await this.createNewModelUsingAPI('GET', `/odata/v4/stoneman-crf/MStage?$filter=Description eq 'CAD_AUTO_DRAFT'`, null, 'templateModel');
                let myModel = this.getView().getModel('templateModel');
                let templateRes = myModel.getData();
                console.log("templateRes::::: ", templateRes);
                this.getEnableDisableAPIForCadDetails(templateRes.value[0].StageGuid);

            },
            getEnableDisableAPIForCadDetails: async function (sstageCode) {

                let editStageCode = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/CadStageCode_StageGuid');
                var body = {
                    DocumentGuid: this.getFormMode() === '3' ? null : this.getListViewEditPropertyValue(),
                    LoginGuid: loginInfo.UserID,
                    RoleGuid: loginInfo.RoleGuid,
                    StageGuid: editStageCode || sstageCode

                }
                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-cad/GetEnableDisable", body, "enabledisableModel");
                let enabledisableModel = this.getView().getModel("enabledisableModel");
                let datamodel = enabledisableModel.getData();


                if (datamodel) {
                    enableDisableArrayForBtn = [];
                    if (datamodel.value.length != 0) {
                        enableDisableArrayForBtn = datamodel.value
                        this.updateControlStatesForBtn(enableDisableArrayForBtn);
                    }
                }

            },

            updateControlStatesForBtn: function (enableDisableArrayForBtn) {
                var view = this.getView();

                enableDisableArrayForBtn.forEach(function (item) {
                    var control = view.byId(item.CONTROLID);

                    if (control) {

                        // Handle visibility
                        if (typeof control.setVisible === "function") {
                            if (Number.isInteger(item.VISIBLE)) {
                                control.setVisible(!!item.VISIBLE);
                            } else {
                                control.setVisible(item.VISIBLE);
                            }
                        } else {
                            console.warn("Control does not support setVisible():", item.CONTROLID, control);
                        }

                        // Handle enable/disable
                        if (typeof control.setEnabled === "function") {
                            if (Number.isInteger(item.ENABLED)) {
                                control.setEnabled(!!item.ENABLED);
                            } else {
                                control.setEnabled(item.ENABLED);
                            }
                        } else {
                            console.warn("Control does not support setEnabled():", item.CONTROLID, control);
                        }

                    } else {
                        console.warn("Control not found in view:", item.CONTROLID);
                    }
                });
                this.disableTableFields("caddetail_mainAssemblyTable", enableDisableArrayForBtn);
                this.disableTableFields("caddetail_AssemblyTable", enableDisableArrayForBtn);
                // this.disableTableFields("caddetail_childAssemblyTree", enableDisableArrayForBtn);
                let ApprovalTransaction = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/ApprovalTransaction');
                let CadStageName = this.getView()
                    .getModel(this.getEntryFormDataSourceModelName())
                    .getProperty("/CadStageName");

                let cureentstageguid = this.getOpenStageForUser(ApprovalTransaction, this.getLoginInfo().UserID);

                // Enable only when stage GUID exists AND CadStageName is CAD_FORMFILL
                let y = {
                    EnableTempCode: !!cureentstageguid && CadStageName === "CAD_FORMFILL"
                };

                let oModel1 = new sap.ui.model.json.JSONModel(y);
                this.getView().setModel(oModel1, "EnableChecked");
            },
            disableTableFields: function (tableId, enableDisableArray) {
                var oTable = this.byId(tableId);
                if (!oTable) return;

                var aItems = oTable.getItems();
                if (!aItems || aItems.length === 0) return;

                aItems.forEach(function (oItem) {
                    var aCells = oItem.getCells();

                    aCells.forEach(function (oCell) {
                        var sControlId = oCell.getId().split("--");

                        // Match controlId from API response
                        let controlState = enableDisableArray.filter(controlItem =>
                            sControlId.some(id =>
                                // match if either string contains the other (covers both "caddetail_productNo" <-> "caddetail_productNo-container-stoneman")
                                (controlItem.CONTROLID && id && controlItem.CONTROLID.includes(id)) ||
                                (controlItem.CONTROLID && id && id.includes(controlItem.CONTROLID))
                            )
                        );

                        // Apply enable/disable if supported
                        if (controlState[0] && typeof oCell.setEnabled === "function") {
                            oCell.setEnabled(Boolean(Number(controlState[0].ENABLED)));
                        }


                        // Check nested controls like inside HBox, VBox, etc.
                        if (typeof oCell.getItems === "function") {
                            oCell.getItems().forEach(function (innerCtrl) {
                                var innerId = innerCtrl.getId().split("--").pop();
                                var innerState = enableDisableArray.find(function (controlItem) {
                                    return innerId.includes(controlItem.CONTROLID);
                                });
                                if (innerState && typeof innerCtrl.setEnabled === "function") {
                                    innerCtrl.setEnabled(innerState.ENABLED);
                                }
                            });
                        }
                    });
                });
            },


            disableTable: function (tableId, enableDisableArray) {
                var oTable = this.byId(tableId); // Get the table by its ID
                if (oTable) {
                    var aItems = oTable.getItems(); // Get the items (rows) of the table

                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells(); // Get the cells (columns) of each row

                        oCells.forEach(function (item) {
                            var sControlId = item.getId();
                            sControlId = sControlId.replace(tableId, ''); // Remove the table ID from the control ID
                            var controlState = enableDisableArray.find(function (controlItem) {
                                return sControlId.includes(controlItem.CONTROLID);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                item.setEnabled(controlState.ENABLED);
                            }
                        });
                    });
                }
            },

            getOpenStageForUser: function (data, userGuid) {
                if (
                    !data ||
                    !Array.isArray(data) ||
                    data.length === 0
                ) {
                    return null;
                }
                for (const transaction of data) {

                    if (Array.isArray(transaction.DataFlow)) {
                        for (const flow of transaction.DataFlow) {
                            if (
                                flow.User_UserGuid === userGuid &&
                                flow.RowStatus === "OPEN"
                            ) {
                                return {

                                    Stage_StageGuid: transaction.Stage_StageGuid
                                };
                            }
                        }
                    }
                }
                return null; // Return null if not found
            },

            onChangeCADReqNo: async function () {
                // if (role.RoleName == "DTP_ASSISTANT") {

                //     let model = this.getView().getModel(this.getEntryFormDataSourceModelName());
                //     model.setProperty("/DTPAssitantName", loginInfo.Username);
                //     model.setProperty("/DTPAssitant_UserID", loginInfo.UserID);
                //     this.getView().setModel(model, this.getEntryFormDataSourceModelName());
                // }

                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqId = y.getProperty("/CrfReqGuid");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$expand=ProductSubCat,Stage($filter=DelMark eq 0),CreatedByUserID,InspDraw($expand=Attachment,User($expand=Role),Attachment $filter=DelMark eq 0),UserAssign($expand=UserID,Parent$filter=DelMark eq 0),SeekAdvice($expand=QuestionToUser,Attachment,Role,QuestionFromUser$filter=DelMark eq 0),Material($filter=DelMark eq 0),ApprovalTransaction($expand=DataFlow($expand=User($filter=DelMark eq 0))$orderby=RowNumber asc),Team($expand=User($expand=Role($expand=Stage))),ProductSubCat,Template($expand=TemplateStages),Brand&$filter=CrfReqGuid eq " + reqId, "", "myModel");
                let myModel = this.getView().getModel("myModel");
                let x = this.getView().getModel(this.getEntryFormDataSourceModelName());
                x.setProperty("/CrfReqUUID_CrfReqGuid", myModel.getProperty("/value/0/CrfReqGuid"));
                x.setProperty("/ReqTyp", myModel.getProperty("/value/0/ReqTyp"));
                x.setProperty("/BuyerCode", myModel.getProperty("/value/0/BuyerCode"));
                x.setProperty("/BuyerName", myModel.getProperty("/value/0/BuyerName"));
                x.setProperty("/BrandName", myModel.getProperty("/value/0/BrandName"));
                x.setProperty("/InputType", myModel.getProperty("/value/0/InputType"));

                x.setProperty("/MerReqDate", myModel.getProperty("/value/0/CrfReqDate"));
                x.setProperty("/Category", myModel.getProperty("/value/0/ProductCatName"));
                x.setProperty("/MCatName", myModel.getProperty("/value/0/MCatName"));
                x.setProperty("/SubCatName", myModel.getProperty("/value/0/SubCatName"));
                x.setProperty("/CategoryCode", myModel.getProperty("/value/0/CategoryCode"));
                x.setProperty("/CategoryUniqueNum", myModel.getProperty("/value/0/CategoryUniqueNum"));
                x.setProperty("/ItemCode", myModel.getProperty("/value/0/ItemCode"));
                x.setProperty("/ItemDesc", myModel.getProperty("/value/0/ItemDesc"));
                x.setProperty("/EstCostInDocCur", myModel.getProperty("/value/0/EstCostInDocCur"));
                x.setProperty("/BuyerCur", myModel.getProperty("/value/0/BuyerCur"));
                x.setProperty("/EstCostInINR", myModel.getProperty("/value/0/EstCostInINR"));
                x.setProperty("/ExchRate", myModel.getProperty("/value/0/ExchRate"));
                x.setProperty("/ItemGroup", myModel.getProperty("/value/0/ItemGroup"));
                x.setProperty("/LblTyp", myModel.getProperty("/value/0/InputType"));
                x.setProperty("/ECNNo", myModel.getProperty("/value/0/ECNNo"));
                x.setProperty("/CarNo", myModel.getProperty("/value/0/CarNo"));
                x.setProperty("/CRFNo", myModel.getProperty("/value/0/CRFNo"));
                x.setProperty("/Reamrks", myModel.getProperty("/value/0/Reamrks"));
                x.setProperty("/InspDraw", myModel.getProperty("/value/0/InspDraw"));
                x.setProperty("/Team", myModel.getProperty("/value/0/Team"));
                x.setProperty("/ProductSubCat", myModel.getProperty("/value/0/ProductSubCat"));
                // x.setProperty("/Team", JSON.parse(JSON.stringify(myModel.getProperty("/value/0/Team"))));
                // var sourceArray = myModel.getProperty("/value/0/Team") || [];
                // var copiedArray = sourceArray.map(function (item) {
                //     return Object.assign({}, item); // Shallow copy each object
                // });

                // x.setProperty("/Team", copiedArray);

                x.setProperty("/Material", myModel.getProperty("/value/0/Material"));
                // // x.setProperty("/CrfStageCode_StageCode_StageConstant", myModel.getProperty("/value/0/CrfStageCode_StageCode_StageConstant"));
                // // x.setProperty("/CrfStageName", myModel.getProperty("/value/0/CrfStageName"));
                x.setProperty("/ApprStatus", "NA");
                // x.setProperty("/DesignerUserId_UserID", myModel.getProperty("/value/0/DesignerUserId_UserID"));
                // x.setProperty("/MerTeamHead_UserID", myModel.getProperty("/value/0/MerTeamHead_UserID"));
                // x.setProperty("/MerTL_UserID", myModel.getProperty("/value/0/MerTL_UserID"));
                // x.setProperty("/MerATL_UserID", myModel.getProperty("/value/0/MerATL_UserID"));
                // x.setProperty("/PDCUserId_UserID", myModel.getProperty("/value/0/PDCUserId_UserID"));
                // x.setProperty("/TechnoUserId_UserID", myModel.getProperty("/value/0/TechnoUserId_UserID"));
                // x.setProperty("/QualityTLUserId_UserID", myModel.getProperty("/value/0/QualityTLUserId_UserID"));
                // x.setProperty("/QualityATLUserId_UserID", myModel.getProperty("/value/0/QualityATLUserId_UserID"));

                // x.setProperty("/MerTeamHead/Username", myModel.getProperty("/value/0/MerTeamHead/Username"));
                // x.setProperty("/MerTL/Username", myModel.getProperty("/value/0/MerTL/Username"));
                // x.setProperty("/MerATL/Username", myModel.getProperty("/value/0/MerATL/Username"));
                // x.setProperty("/TechnoUserId/Username", myModel.getProperty("/value/0/TechnoUserId/Username"));
                // x.setProperty("/QualityTLUserId/Username", myModel.getProperty("/value/0/QualityTLUserId/Username"));
                // x.setProperty("/QualityATLUserId/Username", myModel.getProperty("/value/0/QualityATLUserId/Username"));
                // x.setProperty("/PDCUserId/Username", myModel.getProperty("/value/0/PDCUserId/Username"));

                // x.setProperty("/DesignerUserId/Username", myModel.getProperty("/value/0/DesignerUserId/Username"));


                x.setProperty("/ApprovalTransaction", myModel.getProperty("/value/0/ApprovalTransaction"));
                x.setProperty("/CrfDelDate", myModel.getProperty("/value/0/CrfDelDate"));
                x.setProperty("/Length", myModel.getProperty("/value/0/Length"));
                x.setProperty("/TolLength", myModel.getProperty("/value/0/TolLength"));
                x.setProperty("/Width", myModel.getProperty("/value/0/Width"));
                x.setProperty("/TolWidth", myModel.getProperty("/value/0/TolWidth"));
                x.setProperty("/Height", myModel.getProperty("/value/0/Height"));
                x.setProperty("/TolHeight", myModel.getProperty("/value/0/TolHeight"));
                x.setProperty("/UnitCode", myModel.getProperty("/value/0/UnitCode"));
                x.setProperty("/UnitName", myModel.getProperty("/value/0/UnitName"));
                x.setProperty("/DiaTop", myModel.getProperty("/value/0/DiaTop"));
                x.setProperty("/TolHeight", myModel.getProperty("/value/0/TolHeight"));
                x.setProperty("/TolDiaTop", myModel.getProperty("/value/0/TolDiaTop"));
                x.setProperty("/DiaLeft", myModel.getProperty("/value/0/DiaLeft"));
                x.setProperty("/TolDiaLeft", myModel.getProperty("/value/0/TolDiaLeft"));
                x.setProperty("/DiaRight", myModel.getProperty("/value/0/DiaRight"));
                x.setProperty("/TolDiaRight", myModel.getProperty("/value/0/TolDiaRight"));
                x.setProperty("/DiaBottom", myModel.getProperty("/value/0/DiaBottom"));
                x.setProperty("/TolDiaBottom", myModel.getProperty("/value/0/TolDiaBottom"));
                x.setProperty("/CrfCategory", myModel.getProperty("/value/0/CrfCategory"));
                x.setProperty("/CADLevel", myModel.getProperty("/value/0/CADLevel"));
                x.setProperty("/ProductSubCat/0/Value", myModel.getProperty("/value/0/HolderName"));
                x.setProperty("/ProductSubCat/1/Value", myModel.getProperty("/value/0/ShapeName"));
                x.setProperty("/ProductSubCat/2/Value", myModel.getProperty("/value/0/CordName"));

                x.setProperty("/CountryDescription", myModel.getProperty("/value/0/CountryDescription"));
                x.setProperty("/PDDate", myModel.getProperty("/value/0/PDDate"));
                x.setProperty("/CrfReqDate", myModel.getProperty("/value/0/CrfReqDate"));

                x.getData().Team.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                })
                this.onSelectCADNoSetAssemblyNo(myModel.getData().value[0]);

                const PCategory = myModel.getProperty("/value/0/ProductCatName");
                console.log("this is testing category", PCategory);

                if (PCategory == "Lighting") {

                    let y = {
                        Lighting: true
                    }
                    var oModel1 = new sap.ui.model.json.JSONModel(y);
                    oModel1 = this.getView().setModel(oModel1, 'EnableCheck');

                } else {

                    let y = {
                        Lighting: false
                    }
                    var oModel1 = new sap.ui.model.json.JSONModel(y);
                    oModel1 = this.getView().setModel(oModel1, 'EnableCheck');
                }

                this.getTemplateDataForEnableDisable();

            },
            onCategoryChange: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();

                if (oData.CrfCategory === "CAD" && oData.ReqTyp == "N") {
                    this.byId('IsReCostingReqID').setVisible(false);
                    this.byId('CrfApprovalReqID').setVisible(true);
                    // this.byId('IsReCostingReqID').setEditable(false);
                    // this.byId('CrfApprovalReqID').setEditable(false);
                    this.byId('CRFCostingTypeID').setVisible(true);
                    // this.byId('CRFCostingTypeID').setEditable(false);

                }
                else if (oData.CrfCategory === "CAD" && oData.ReqTyp == "R") {
                    this.byId('CRFCostingTypeID').setVisible(true);
                    // this.byId('CRFCostingTypeID').setEditable(false);
                    this.byId('IsReCostingReqID').setVisible(false);
                    if (oData.CostingType === "Rendering") {
                    }
                    if (oData.CostingType === "CAD-OnlyCosting") {
                        this.byId('CrfApprovalReqID').setVisible(true);
                        // this.byId('CrfApprovalReqID').setEditable(false);
                    }
                    else if (oData.CostingType === "CAD") {
                        this.byId('CrfApprovalReqID').setVisible(true);
                        // this.byId('CrfApprovalReqID').setEditable(false);
                    }
                    else if (oData.CostingType === "Sample") {
                        this.byId('CrfApprovalReqID').setVisible(true);
                        // this.byId('CrfApprovalReqID').setEditable(false);
                    }
                }
            },
            // getTemplateDataForEnableDisable: async function () {

            //     var body = {

            //         "MenuSubType": "CAD",
            //         "MenuCode": "CAD"

            //     };
            //     await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-crf/GetTemplate', body, 'templateModel');
            //     let myModel = this.getView().getModel('templateModel');
            //     let templateRes = myModel.getData();
            //     let tempData = templateRes.value.filter(item => item.STAGECODE === 'CAD_FORMFILL');

            //     let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
            //     oModel.setProperty('/Template_TemplateGuid', tempData[0].TEMPLATEGUID)
            //     oModel.setProperty('/CrfStatus', 'New')
            //     oModel.setProperty('/newApprovalStatus', 'NA')
            // },


            deepCopy: async function (obj, depth, currentDepth) {
                if (currentDepth === undefined) {
                    currentDepth = 0;
                }

                if (currentDepth >= depth || obj === null || typeof obj !== "object") {
                    return obj;
                }

                var copy = Array.isArray(obj) ? [] : {};

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        copy[key] = this.deepCopy(obj[key], depth, currentDepth + 1);
                    }
                }

                return copy;
            },
            onSelectCADNoSetAssemblyNo: function (aData) {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var oData = oModel.getData();
                // var teamArray = myModel.getProperty("/value/0/Team");
                oData.InspDraw.forEach(function (item) {
                    item.RowStatus = "REFERENCE";
                });
                // oData.Team.forEach(item => {
                //     for (let i = 0; i < item.User.Role.Stage.length; i++) {
                //         const Stagerole = item.User.Role.Stage[i];
                //         const isStagePresent = aData.Template.TemplateStages.some(stage => stage.Stage_StageGuid === Stagerole.Stage_StageGuid);
                //         if (isStagePresent) {
                //             item.UserType = false;
                //             break;  // Breaks the inner loop if a matching Stage_StageGuid is found
                //         } else {
                //             item.UserType = true;
                //         }
                //     }
                // });
                oData.MainAssembly.forEach(function (item) {
                    item.AssemblyCadNo = (aData.Category === null ? '' : aData.Category) + '1' + (aData.ItemCode === null ? '' : aData.ItemCode);
                    item.AssemblyCadName = aData.ItemDesc;
                })
                oData.SubAssembly.forEach(function (item) {
                    item.AssemblyCADNo = (aData.Category === null ? '' : aData.Category) + '1' + (aData.ItemCode === null ? '' : aData.ItemCode);
                    item.AssemblyCadName = aData.ItemDesc;
                })
                oData.ChildAssembly.forEach(function (item) {
                    item.AssemblyCadNo = (aData.Category === null ? '' : aData.Category) + '1' + (aData.ItemCode === null ? '' : aData.ItemCode);
                    item.AssemblyCadName = aData.ItemDesc;
                })
                oModel.setData(oData);
            },
            onCheckDiamension: function (oEvent) {
                oSelectDiamension = oEvent.getParameter("selected");
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oViewModel.setProperty("/isDiamension", oSelectDiamension);
            },
            subscribeFragment: async function () {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.subscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);
            },
            onCloseAttachmentDialog: function () {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.unsubscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);

                if (this._oDialog1) {
                    this._oDialog1.close();
                    this._oDialog1.destroy();
                    this._oDialog1 = undefined;
                }
            },
            onDeleteTeam: function (oEvent) {
                let oCtx = oEvent.getSource().getBindingContext("EntryFormDataSourceModel");

                if (!oCtx) {
                    sap.m.MessageToast.show("No team member found.");
                    return;
                }

                let oModel = oCtx.getModel();
                let sPath = oCtx.getPath(); // path of the clicked row e.g. "/Team/0"

                // remove that row from model
                let aData = oModel.getProperty("/Team");
                let iIndex = parseInt(sPath.split("/").pop(), 10);

                if (!isNaN(iIndex)) {
                    aData.splice(iIndex, 1);
                    oModel.setProperty("/Team", aData);
                    sap.m.MessageToast.show("Row deleted successfully");
                }
            },
            onDeleteDialog: async function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext("AttachModel");
                const sPath = oContext.getPath();
                const oModel = this.getView().getModel('AttachModel');
                const aFiles = oModel.getProperty("/Attachments");
                // call DeleteAttachmentFromDMS
                // console.log(aFiles)
                const iIndex = parseInt(sPath.split("/")[2], 10); // Extract index
                if (aFiles[iIndex].AttachmentGuId) {
                    let payload = {
                        "Files": [
                            {
                                "AttachmentGuId": aFiles[iIndex].AttachmentGuId
                            }
                        ]
                    }
                    let datafordelete = this.getView().getModel("filesPayload");
                    if (datafordelete?.Files) {
                        datafordelete.Files.push(...payload.Files);
                    } else {
                        datafordelete = payload
                    }
                    this.getView().setModel(datafordelete, "filesPayload")
                    // await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DeleteAttachmentFromDMS", payload, "DeleteAttachModel");
                    // const res = this.getApiResponseObject();
                    // console.log("delete Response", res)
                }
                aFiles.splice(iIndex, 1); // Remove the file at the index
                oModel.setProperty("/Attachments", aFiles);
                sap.m.MessageToast.show("File deleted successfully.");

            },

            onUploadDialog: function () {
                const oFileUploader = this.byId("fileUploadTable");
                oFileUploader.upload();
            },

            onViewFileHandler: async function (oEvent, modelPath) {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.subscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);
                let oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oDataInspDraw = oMainModel.getProperty(modelPath);
                // let oAttachmentArray = oDataInspDraw[this.iRowAttachmentIndex].Attachment;
                let oAttachmentArray = oDataInspDraw?.[this.iRowAttachmentIndex]?.Attachment || oDataInspDraw?.Attachment;

                if (!oAttachmentArray || oAttachmentArray.length === 0) {
                    MessageToast.show("No attachments available.");
                    return;
                }
                let oSelectedAttachment = null;
                // Process the selected attachment
                // let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");
                let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");

                if (oBindingContext) {
                    oSelectedAttachment = oBindingContext.getObject();
                }

                // Case 2: From root model (single attachment)
                if (!oSelectedAttachment) {
                    oSelectedAttachment = this.getView().getModel(this.getEntryFormDataSourceModelName())?.getProperty("/MainAttachment/Attachment");

                }
                //let oSelectedAttachment = oBindingContext.getObject();
                if (!oSelectedAttachment || !oSelectedAttachment.AttachmentGuId) {
                    MessageToast.show("Invalid or missing attachment data.");
                    return;
                }

                // Proceed with the selected attachment
                let payload = {
                    ID: oSelectedAttachment.AttachmentGuId
                };
                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DGetAttachmentDataWithFile", payload, "viewAttachModel");
                const res = this.getApiResponseObject();

                if (res.success) {
                    this.displayAttachment(res.object.value);
                } else {
                    MessageToast.show(res.object.responseJSON.error.message || "Failed to retrieve attachment data.");
                }
            },

            displayAttachment: function (attachmentData) {
                if (!attachmentData || !attachmentData.Base64File || !attachmentData.OrgFileExtension) {
                    MessageToast.show("Attachment data is invalid.");
                    return;
                }

                let sBase64 = attachmentData.Base64File;
                let sFileType = attachmentData.OrgFileExtension;

                let byteCharacters = atob(sBase64);
                let byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
                let byteArray = new Uint8Array(byteNumbers);
                let blob = new Blob([byteArray], { type: 'application/pdf' });
                let sBlobUrl = URL.createObjectURL(blob);

                if (sFileType === "pdf") {
                    if (!this._pdfViewer) {
                        this._pdfViewer = new sap.m.PDFViewer();
                        this.getView().addDependent(this._pdfViewer);
                    }
                    this._pdfViewer.setSource(sBlobUrl);
                    // this._pdfViewer.open();
                    window.open(sBlobUrl, "_blank");

                    // var oPDFViewer = new PDFViewer();
                    // this.getView().addDependent(oPDFViewer);
                    // oPDFViewer.setSource(sBlobUrl);
                    // oPDFViewer.open();
                }
                else if (["png", "jpg", "jpeg", "avif"].includes(sFileType.toLowerCase())) {
                    const oDialog = new Dialog({
                        title: "View Attachment",
                        content: new sap.m.Image({
                            src: sBlobUrl,
                            width: "100%",
                            height: "100%"
                        }),
                        endButton: new sap.m.Button({
                            text: "Close",
                            press: function () {
                                oDialog.close(); // Use the dialog instance directly
                            }
                        })
                    });

                    // Open the dialog
                    oDialog.open();
                }
                else {
                    MessageToast.show("Unsupported file type.");
                }
            },

            onViewFileSeek: async function (oEvent) {
                await this.onViewFileHandler(oEvent, "/SeekAdvice");
            },

            openAttachmentDialog: function (oEvent) {
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();
                let sModelName = this.getEntryFormDataSourceModelName();

                // Get models
                let oModelAttachAdd = this.getView().getModel('AttachModel');
                let oDataAttachAdd = oModelAttachAdd.getData();
                let oMainAttachment = this.getView().getModel(sModelName);

                // Initialize/reset flags
                oMainAttachment.setProperty("/isMainAssembly", false);
                oMainAttachment.setProperty("/isSubAssembly", false);
                oMainAttachment.setProperty("/isChildAssembly", false);
                oMainAttachment.setProperty("/isSeekAdvise", false);

                // Identify button type
                const isAddNewButton = sButtonId.includes("CAD_addAttachBtnNew");
                const isViewFileButton = sButtonId.includes("CAD_attachFileViewBtn");
                let oDataAttach = oMainAttachment.getProperty("/InspDraw");
                const alreadyuser = oDataAttach.some((ele) => ele.User_UserGuid == role.UserID)
                if (alreadyuser && isAddNewButton) {
                    sap.m.MessageToast.show(
                        "Please Select New Attachment! Can't Add New Attachment for Same User. Added to your existing row."
                    );
                    return;
                }

                if (isAddNewButton) {

                    // 💡 Add New logic (button outside table, no binding context)
                    console.log("Add Drawing button clicked");

                    oMainAttachment.setProperty("/isInspDraw", false);
                    oMainAttachment.setProperty("/iRowAttachmentIndex", null);

                    // If you want to show open attachments or just an empty list
                    let aInspDraw = oMainAttachment.getProperty("/InspDraw") || [];
                    const aOpenRows = aInspDraw.filter((row) => row.RowStatus === "OPEN");

                    oDataAttachAdd.Attachments = aOpenRows[0]?.Attachment || [];
                    oModelAttachAdd.setData(oDataAttachAdd);

                } else if (isViewFileButton) {
                    // 💡 View File logic (button inside table, has binding context)
                    console.log("View File button clicked");

                    let oBindingContext = oButton.getBindingContext(sModelName);
                    if (!oBindingContext) {
                        console.error("No binding context found for button:", sButtonId);
                        sap.m.MessageToast.show("No binding context found for this attachment.");
                        return;
                    }

                    let sPath = oBindingContext.getPath(); // e.g. "/InspDraw/0"
                    this.iRowAttachmentIndex = sPath.split('/').pop();

                    oMainAttachment.setProperty("/isInspDraw", true);
                    oMainAttachment.setProperty("/iRowAttachmentIndex", this.iRowAttachmentIndex);

                    let aInspDraw = oMainAttachment.getProperty("/InspDraw") || [];
                    let attachments = aInspDraw[this.iRowAttachmentIndex]?.Attachment || [];

                    // Map attachments for display
                    oDataAttachAdd.Attachments = attachments.map((item) => ({
                        AttachmentName: item.AttachmentName || null,
                        OrgFileExtension: item.OrgFileExtension || null,
                        AttachmentGuId: item.AttachmentGuId || null,
                        fileBase64: item.fileBase64 || null,
                    }));

                    oModelAttachAdd.setData(oDataAttachAdd);
                } else {
                    // Unknown button pressed — fail gracefully
                    console.warn("Unhandled button ID:", sButtonId);
                    return;
                }
                if (!this._oDialog1 || this._oDialog1.bIsDestroyed) {

                    this._sAttachFragId = this.createId("AttachDialog_" + Date.now());

                    this._oDialog1 = sap.ui.xmlfragment(
                        this._sAttachFragId,
                        "stoneman.modone.view.attachmentDialog",
                        this
                    );

                    this.getView().addDependent(this._oDialog1);
                }

                /* ✅ get FileUploader from fragment */
                var oFileUploader = sap.ui.core.Fragment.byId(
                    this._sAttachFragId,
                    "fileUploadTable"
                );

                if (oFileUploader) {
                    oFileUploader.clear();
                }

                // // 💬 Create dialog if not already created or destroyed
                // if (!this._oDialog1 || this._oDialog1.bIsDestroyed) {
                //     this._oDialog1 = sap.ui.xmlfragment(
                //         this.createId("AttachmentDialog_" + Date.now()),
                //         "stoneman.modone.view.attachmentDialog",
                //         this
                //     );
                //     this.getView().addDependent(this._oDialog1);
                // }

                // Refresh dialog model every time before opening
                this._oDialog1.setModel(oModelAttachAdd, "AttachModel");
                this._oDialog1.open();
            },

            openAttachmentDialogMainAssembly: function (oEvent) {
                this.subscribeFragment();
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();

                let oBindingContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());
                let sPath = oBindingContext.getPath(); // e.g., "/InspDraw/0"
                this.iRowAttachmentIndex = sPath.split('/').pop();

                const isSeekAdvise = sButtonId.includes('fileUploadSeekTable');
                const isMainAssembly = sButtonId.includes('attachFileViewBtnMainAssemblyCAD');
                const isSubAssembly = sButtonId.includes('attachFileViewBtnSubAssemblyCAD');
                const isChildAssembly = sButtonId.includes('attachFileViewBtnChildAssemblyCAD');

                let isAddNewButtonSub = sButtonId.includes('caddetail_addSubAssmblyBtn');
                let isAddNewButtonChild = sButtonId.includes('caddetail_addChildBtn');

                // Create the JSONModel
                let oModelAttachAdd = this.getView().getModel('AttachModel');
                let oDataAttachAdd = oModelAttachAdd.getData();
                oDataAttachAdd.isButtonEnabled = true;
                let oMainAttachment = this.getView().getModel(this.getEntryFormDataSourceModelName())

                oMainAttachment.setProperty("/iRowAttachmentIndex", this.iRowAttachmentIndex);
                oMainAttachment.setProperty("/isMainAssembly", isMainAssembly);
                oMainAttachment.setProperty("/isSubAssembly", isSubAssembly);
                oMainAttachment.setProperty("/isChildAssembly", isChildAssembly);
                oMainAttachment.setProperty("/isSeekAdvise", isSeekAdvise);
                oMainAttachment.setProperty("/isInspDraw", false);

                let oDataAttach;
                if (isMainAssembly) {
                    oDataAttach = oMainAttachment.getProperty("/MainAssembly");
                }
                if (isSubAssembly) {
                    oDataAttach = oMainAttachment.getProperty("/SubAssembly");
                }
                if (isChildAssembly) {
                    oDataAttach = oMainAttachment.getProperty("/ChildAssembly");
                }

                const filterData = oDataAttach.filter((ele) => ele.RowStatus == 'OPEN')


                if (isAddNewButtonSub || isAddNewButtonChild) {

                    // Clear existing data for Add New button
                    oModelAttachAdd.setData({ Attachments: filterData[0]?.Attachment, isButtonEnabled: false });
                    // this._oDialog1.setModel(oModelAttachAdd, 'AttachModel');
                }
                else if (sButtonId.includes('attachFileViewBtnMainAssemblyCAD') || sButtonId.includes('attachFileViewBtnChildAssemblyCAD') || sButtonId.includes('attachFileViewBtnSubAssemblyCAD')) {
                    let oBindingContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());
                    let sPath = oBindingContext.getPath(); // e.g., "/InspDraw/0"
                    //  this.iRowAttachmentIndex = parseInt(sPath.split("/").pop(), 10); // Extract the last part of the path as index
                    this.iRowAttachmentIndex = sPath.split('/').pop();

                    // let oModelAttachFile = this.getView().getModel(this.getEntryFormDataSourceModelName());


                    // let oDataAttachFile = oModelAttachFile.getProperty("/InspDraw");

                    // Populate data for View File button
                    let attachments = oDataAttach[this.iRowAttachmentIndex]?.AssemblyCadAttachment || []; // Fetch attachments
                    oDataAttachAdd.Attachments = attachments.map((item) => ({
                        AttachmentName: item.AttachmentName || null,
                        OrgFileExtension: item.OrgFileExtension || null, // Set fileType from OrgFileExtension if required
                        AttachmentGuId: item.AttachmentGuId || null, // Set fileType from OrgFileExtension if required
                    }));
                    oModelAttachAdd.setData(oDataAttachAdd);
                }
                // if (this.getFormMode() === '3') {
                //     // Clear existing data for Add New button
                //     oModelAttachAdd.setData({ Attachments: null, isButtonEnabled: false });
                // } else {

                // }
                if (!this._oDialog1) {
                    this._oDialog1 = sap.ui.xmlfragment(this.getView().getId(), "stoneman.modone.view.attachmentDialog", this);
                    this.getView().addDependent(this._oDialog1);
                    this._oDialog1.setModel(oModelAttachAdd, 'AttachModel');
                }
                this._oDialog1.open();
            },

            openAttachmentDialogSeekAdvise: function (oEvent) {
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();

                let oBindingContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());
                let sPath = oBindingContext.getPath(); // e.g., "/InspDraw/0"
                this.iRowAttachmentIndex = sPath.split('/').pop();

                // Create the JSONModel
                let oModelAttachAdd = this.getView().getModel('AttachModel');
                let oDataAttachAdd = oModelAttachAdd.getData();
                let oMainAttachment = this.getView().getModel(this.getEntryFormDataSourceModelName());

                oMainAttachment.setProperty("/isSeekAdvise", sButtonId.includes('attachFileViewBtnSeekAdviseCAD'));
                oMainAttachment.setProperty("/iRowAttachmentIndex", this.iRowAttachmentIndex);
                oMainAttachment.setProperty("/isMainAssembly", false);
                oMainAttachment.setProperty("/isSubAssembly", false);
                oMainAttachment.setProperty("/isChildAssembly", false);
                oMainAttachment.setProperty("/isInspDraw", false);

                let oDataAttach = oMainAttachment.getProperty("/SeekAdvice");

                // Populate data for View File button
                let attachments = oDataAttach[this.iRowAttachmentIndex]?.Attachment || []; // Fetch attachments
                oDataAttachAdd.Attachments = attachments.map((item) => ({
                    AttachmentName: item.AttachmentName || null,
                    OrgFileExtension: item.OrgFileExtension || null, // Set fileType from OrgFileExtension if required
                    AttachmentGuId: item.AttachmentGuId || null, // Set fileType from OrgFileExtension if required
                }));
                oModelAttachAdd.setData(oDataAttachAdd);

                if (!this._oDialog1) {
                    this._oDialog1 = sap.ui.xmlfragment(this.getView().getId(), "stoneman.modone.view.attachmentDialog", this);
                    this.getView().addDependent(this._oDialog1);
                    this._oDialog1.setModel(oModelAttachAdd, 'AttachModel');
                }
                this._oDialog1.open();
            },

            // Helper function to read file as Base64
            _readFileAsBase64Multiple: function (file, callback) {

                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64String = event.target.result.split(",")[1]; // Get Base64 part of the string
                    callback(base64String);
                };
                reader.onerror = function (error) {
                    console.error("Error reading file as Base64:", error);
                    sap.m.MessageToast.show("Error reading file: " + file.name);
                };
                reader.readAsDataURL(file); // Read file as Data URL

            },

            onFileChangeDialog: function (oEvent) {
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();
                // Determine if the dialog should be cleared

                let oFileAttachUploader = this.byId('fileUploadTable');
                let oFileSeekUploader = this.byId('fileUploadSeekTable');
                const aFiles = oEvent.getParameter("files"); // Get selected files
                let oModel = this.getView().getModel("AttachModel");
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());


                if (oMainModel.getProperty('/isSeekAdvise')) {
                    this._aBase64FilesSeekAdvice = oModel.getProperty("/Attachments") || []; // Get existing file data
                }
                if (oMainModel.getProperty('/isMainAssembly')) {
                    this._aBase64FilesMainAssembly = oModel.getProperty("/Attachments") || []; // Get existing file data
                }
                if (oMainModel.getProperty('isSubAssembly')) {
                    this._aBase64FilesSubAssembly = oModel.getProperty("/Attachments") || []; // Get existing file data
                }
                if (oMainModel.getProperty('/isChildAssembly')) {
                    this._aBase64FilesChildAssembly = oModel.getProperty("/Attachments") || []; // Get existing file data
                }

                this._aBase64FilesMultiple = oModel.getProperty("/Attachments") || []; // Get existing file data

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                if (aFiles.length) {
                    Array.from(aFiles).forEach((file, index) => {
                        // Use FileReader to convert the file to Base64
                        this._readFileAsBase64Multiple(file, (base64) => {
                            if (oMainModel.getProperty('/isSeekAdvise')) {
                                // Push file details and base64 string into the model data
                                this._aBase64FilesSeekAdvice.push({
                                    AttachmentName: file.name,
                                    OrgFileExtension: file.name.split('.').pop(),
                                    //fileSize: (file.size / 1024).toFixed(2), // Convert to KB
                                    fileBase64: base64, // Base64 encoded string
                                });

                                // Update the model once all files are processed
                                oModel.setProperty("/Attachments", this._aBase64FilesSeekAdvice);
                                oModel.setProperty("/isButtonEnabled", this._aBase64FilesSeekAdvice.length > 0);
                            }
                            else {
                                this._aBase64FilesMultiple.push({
                                    AttachmentName: file.name,
                                    OrgFileExtension: file.name.split('.').pop(),
                                    //fileSize: (file.size / 1024).toFixed(2), // Convert to KB
                                    fileBase64: base64, // Base64 encoded string
                                });

                                // Update the model once all files are processed
                                oModel.setProperty("/Attachments", this._aBase64FilesMultiple);
                                oModel.setProperty("/isButtonEnabled", this._aBase64FilesMultiple.length > 0);


                            }
                            oModel.refresh(true);
                        });
                    });
                } else {
                    sap.m.MessageToast.show("No file selected");
                }
                if (oMainModel.getProperty('/isSeekAdvise')) {
                    oFileSeekUploader.clear();
                } else {
                    oFileAttachUploader.clear();
                }
            },


            onSaveAttachmentData: function () {
                // Get dialog model data
                const oDialogModel = this._oDialog1.getModel("AttachModel");
                const oData = oDialogModel.getData();

                // Main model and data
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let aData = oMainModel.getProperty("/InspDraw") || []; // Ensure it's an array
                const oMainData = oMainModel.getData();
                const hasOpenRowForUser = () =>
                    aData.findIndex(r => r.User_UserGuid === role.UserID && r.RowStatus === "OPEN");

                // Helper function to create a new row
                const createNewRow = () => ({
                    RowNumber: aData.length + 1,
                    ApprovalStatus: "NA",
                    AttachmentRemarks: oMainData.AttachmentRemarks,
                    CadAttachmentsGuid: null,
                    DelMark: 0,
                    Parent_CafReqGuid: null,
                    Remarks: null,
                    RowStatus: "OPEN",
                    StageCode: oMainData.CrfStageCode,
                    RoleName: role.RoleName,
                    UserName: loginInfo.Username,
                    Stage_StageGuid: oMainData.Stage_StageGuid,
                    User_UserGuid: role.UserID,
                    Attachment: oData.Attachments,
                    User: {
                        UserName: loginInfo.Username,
                        Role: {
                            RoleCode: role.RoleName
                        }
                    }
                });
                if (oMainData.isSeekAdvise === true) {
                    console.log("isSeekAdvise = TRUE → Running SeekAdvice logic instead of InspDraw");
                    let index = oMainModel.getProperty("/iRowAttachmentIndex");

                    let aSeek = oMainModel.getProperty("/SeekAdvice") || [];
                    const newAttachments = oData.Attachments || [];

                    // Merge both arrays
                    aSeek[index].Attachment = newAttachments;

                    // Optional: update remarks or metadata
                    aSeek[index].AttachmentRemarks = oMainData.AttachmentRemarks;
                    oMainModel.setProperty("/SeekAdvice", aSeek);
                    oMainModel.refresh(true);
                    this._oDialog1.close();




                    return;
                }


                const iUserRow = hasOpenRowForUser();


                if (iUserRow === -1) {
                    // no row yet -> add one
                    aData.push(createNewRow());
                    oMainModel.setProperty("/InspDraw", aData);
                    this._oDialog1.close();
                    return;
                }
                const existingAttachments = aData[iUserRow].Attachment || [];
                const newAttachments = oData.Attachments || [];

                // Merge both arrays
                aData[iUserRow].Attachment = newAttachments;

                // Optional: update remarks or metadata
                aData[iUserRow].AttachmentRemarks = oMainData.AttachmentRemarks;


                // ✅ Tell SAPUI5 the model data has changed
                oMainModel.setProperty("/InspDraw", aData);
                oMainModel.refresh(true);
                this._oDialog1.close();


            },

            onCheckDiameter: function (oEvent) {
                oSelectDiameter = oEvent.getParameter("selected");
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oViewModel.setProperty("/isDiaMeter", oSelectDiameter);
            },

            cflforOldReqNo: async function () {
                this.setCflTitle("CAD Request No List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-cad/TCadDetail?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["CadDetailNo", "CadDetailUUID"]);
                this.setCflDataColumns(["CadDetailNo", "CadDetailUUID"]);
                this.setCflValueAndDisplay("", "", "cadReqNo", "CadDetailNo");
                this.setCflSearchProperty("CadDetailNo");
                this.showCfl("caddetail_cadReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForOldcrf.bind(this));
            },
            onClosecflForCADDetailNo: function () {
                let object = this.getCflObject();
                let model = this.getView().getModel(this.getEntryFormDataSourceModelName());

                model.setProperty("/CrfReqGuid", object.CrfReqGuid);
                model.setProperty("/CrfReqUUID_CrfReqGuid", object.CrfReqGuid);
                this.onChangeCADReqNo();
                this.onChangeCADReqNo();
            },
            cflforCADNo: async function () {
                this.setCflTitle("CAD Request No List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$filter=CrfStatus eq 'CLS' and CrfCategory eq 'CAD'&$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["CrfReqNo", "CrfReqUUID"]);
                this.setCflDataColumns(["CrfReqNo", "CrfReqUUID"]);
                this.setCflValueAndDisplay("/CrfReqNo", "CrfReqNo", "", "");
                this.setCflSearchProperty("CrfReqNo");
                this.showCfl("caddetail_cadReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForCADDetailNo.bind(this));
            },
            cflForMaterialCategory: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Material Category List");
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/YY1_ExtProdGrp", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["ExternalProductGroup", "ExternalProductGroupName"]);
                this.setCflDataColumns(["ExternalProductGroup", "ExternalProductGroupName"]);
                this.setCflValueAndDisplay(`/Material/${rowIndex}/MaterialCatHanaText`, "ExternalProductGroupName", "", "");
                this.setCflSearchProperty("ExternalProductGroupName");
                this.showCfl("caddetail_materialCategory", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforMaterialCategory.bind(this), this.onCancelforMaterialCategory.bind(this));

            },
            cflForChildProcess: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/");
                irowIndex = rowIndex;
                this.iMainIndex = rowIndex[2];       // MainAssembly index
                this.iParentIndex = rowIndex[4];     // ChildAssembly index
                this.iRowIndex = rowIndex[6];

                // ✅ Fetch Type value from model
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var sTypePath = `/MainAssembly/${this.iMainIndex}/ChildAssembly/${this.iParentIndex}/Type`;
                var sType = oModel.getProperty(sTypePath);
                let Data = {
                    Type: sType
                }

                this.setCflTitle("Process Master");
                await this.createNewModelUsingAPI("POST", `/odata/v4/stoneman-cad/GetProcessData`, Data, this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Name", "Code", "Description"]);
                this.setCflDataColumns(["Name", "Code", "Description"]);
                this.setCflValueAndDisplay(`/MainAssembly/${this.iMainIndex}/ChildAssembly/${this.iParentIndex}/ChildProcess/${this.iRowIndex}/ProcessName`, "Name", "", "");
                this.setCflSearchProperty("Name");
                this.showCfl("caddetail_processMaster", this.getCflListViewDataSourceModelName(), "value", this.onConfirmforChildProcess.bind(this), this.onCancelforChildProcess.bind(this));

            },

            onConfirmforChildProcess: function () {
                //                 let x = this.getCflObject();
                //                 let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // y.setProperty(`/MainAssembly/${this.iMainIndex}/ChildAssembly/${this.iParentIndex}/ChildProcess/${this.iRowIndex}/Process_ProcessUUID`, x.Process_ProcessUUID);
                //                 y.setProperty(`/MainAssembly/${this.iMainIndex}/ChildAssembly/${this.iParentIndex}/ChildProcess/${this.iRowIndex}/ProcessName`, x.Name);
                let x = this.getCflObject();

                // Get your main model
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());

                // Base path to the current process node
                const sBasePath = `/MainAssembly/${this.iMainIndex}/ChildAssembly/${this.iParentIndex}/ChildProcess/${this.iRowIndex}`;

                // Set the main process info

                y.setProperty(sBasePath + "/ProcessName", x.Name);
                y.setProperty(sBasePath + "/ProcessType", x.Type);
                y.setProperty(sBasePath + "/ProcessCode", x.Code);
                y.setProperty(sBasePath + "/ProcessDescription", x.Description);
                // y.setProperty(sBasePath + "/ProcessCode", `${x.Code} - ${x.Description}`);
                // ✅ Now populate SubProcesses (if present in x.Detail)
                if (x.Detail && x.Detail.length > 0) {
                    // Create array of subprocesses
                    const aSubProcessesDetail = x.Detail.map(sp => ({
                        SubProcessCode: sp.Code,
                        SubProcessName: sp.Name,
                        UOMName: sp.UOMName,
                        UOMCode: sp.UOMCode,
                        ISOUOMCode: sp.ISOUOMCode,
                        Voltage: sp.Voltage,
                        Temperature: sp.Temprature,
                        Rate: sp.Rate,
                        ProcessCost: sp.ProcessCost,
                        Percentage: sp.Percentage,
                        ContractorProfit: sp.ContractorProfit,
                        WastagePercentage: sp.WastagePercentage,
                        OverheadPercentage: sp.OverheadPercentage,

                        //IsParent: false // if needed for your Add/Delete button logic
                    }));

                    y.setProperty(sBasePath + "/Details", aSubProcessesDetail);
                } else {
                    y.setProperty(sBasePath + "/Details", []);
                }

                y.refresh(true);



            },


            onCancelforChildProcess: function () {

            },

            onConfirmforMaterialCategory: function () {

            },
            onCancelforMaterialCategory: function () {

            },
            cflForDeptSeek: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Department List");
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2?$top=1000", "", this.getCflListViewDataSourceModelName());
                this.setCflListViewDataSourceProperties("GET", "/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2?$top=1000", "", "value");
                this.setCflDisplayColumns(["CostCenter", "CostCenterName", "CostCenterDescription"]);
                this.setCflDataColumns(["CostCenter", "CostCenterName", "CostCenterDescription"]);
                this.setCflValueAndDisplay(`/SeekAdvice/${rowIndex}/DepartmentCode`, "CostCenter", "", "");
                this.setCflSearchProperty("CostCenter");
                this.showCfl("caddetail_dept", this.getCflListViewDataSourceModelName(), "value", this.onConfirmforDeptSeek.bind(this), this.onCancelforDeptSeek.bind(this));

            },

            onConfirmforDeptSeek: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SeekAdvice/${irowIndex}/DepartmentName`, x.CostCenterName);
            },
            onCancelforDeptSeek: function () {

            },
            cflForUserSeek: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("User List");
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let costcenter = y.getProperty(`/SeekAdvice/${rowIndex}/DepartmentCode`);
                // await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MUser" + "?$expand=Role", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=Role",
                    '',
                    this.getCflListViewDataSourceModelName()
                );

                this.setCflDisplayColumns(["User Name", "User Code"]);
                this.setCflDataColumns(["UserName", "UserCode"]);
                this.setCflValueAndDisplay(`/SeekAdvice/${rowIndex}/QuestionToUserName`, "UserName", "", "");
                this.setCflSearchProperty("UserName");
                this.showCfl("caddetail_user", this.getCflListViewDataSourceModelName(), "value", this.onConfirmforUserSeek.bind(this), this.onCancelforUserSeek.bind(this));

            },
            onConfirmforUserSeek: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SeekAdvice/${irowIndex}/QuestionToUser_UserGuid`, x.UserGuid);
                y.setProperty(`/SeekAdvice/${irowIndex}/Role_RoleGuid`, x.Role_RoleGuid);

                if (y.getProperty(`/SeekAdvice/${irowIndex}/Role`) === null) {
                    let role = {
                        DelMark: 0,
                        Description: null,
                        Remarks: null,
                        RoleCode: x.UserRoleCode,
                        RoleGuid: null
                    }
                    y.setProperty(`/SeekAdvice/${irowIndex}/Role`, role);
                } else {
                    y.setProperty(`/SeekAdvice/${irowIndex}/Role/RoleCode`, x.UserRoleCode);
                }
            },
            onCancelforUserSeek: function () {

            },
            cflForUOM: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("UOM List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["UnitOfMeasure"]);
                this.setCflDataColumns(["UnitOfMeasure"]);
                this.setCflValueAndDisplay(`/MainAssembly/${rowIndex}/UOMCode`, "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasure");
                this.showCfl("caddetail_uom", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforUOM.bind(this), this.onCancelforUOM.bind(this));


            },
            onConfirmforUOM: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/MainAssembly/${irowIndex}/UOMName`, x.UnitOfMeasureLongName);

            },
            onCancelforUOM: function () {

            },
            cflForUoMDimension: async function () {

                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());
                this.setCflTitle("UOM List");
                this.setCflDisplayColumns(["Unit Of Measure", "Unit Of Measure Name"]);
                this.setCflDataColumns(["UnitOfMeasure", "UnitOfMeasureLongName"]);
                this.setCflValueAndDisplay("/UnitCode", "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasureLongName");
                this.showCfl("caddetail_dUnit", this.getCflListViewDataSourceModelName(), "d/results", this.onClosecflForUoMDimension.bind(this));

            },


            onClosecflForUoMDimension: function () {

                let oUoMRes = this.getCflObject();
                let oUoMResSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oUoMResSetData.setProperty("/UnitName", oUoMRes.UnitOfMeasureLongName);
            },

            cflForUOMSubAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("UOM List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["UnitOfMeasure"]);
                this.setCflDataColumns(["UnitOfMeasure"]);
                this.setCflValueAndDisplay(`/SubAssembly/${rowIndex}/UOMCode`, "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasure");
                this.showCfl("caddetail_subUOM", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforUOMSubAssembly.bind(this), this.onCancelforUOMSubAssembly.bind(this));


            },
            onConfirmforUOMSubAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SubAssembly/${irowIndex}/UOMName`, x.UnitOfMeasureLongName);

            },
            onCancelforUOMSubAssembly: function () {

            },
            cflForUOMChildAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("UOM List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["UnitOfMeasure"]);
                this.setCflDataColumns(["UnitOfMeasure"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/UOMCode`, "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasure");
                this.showCfl("caddetail_childUOM", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforUOMChildAssembly.bind(this), this.onCancelforUOMChildAssembly.bind(this));


            },
            onConfirmforUOMChildAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/ChildAssembly/${irowIndex}/UOMName`, x.UnitOfMeasureLongName);

            },
            onCancelforUOMChildAssembly: function () {

            },
            cflForUOMChildAssemblyNetWeight: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("UOM List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["UnitOfMeasure"]);
                this.setCflDataColumns(["UnitOfMeasure"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/NetWeightUOM`, "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasure");
                this.showCfl("caddetail_childWeightUOM", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforUOMChildAssemblyNetWeight.bind(this), this.onCancelforUOMChildAssemblyNetWeight.bind(this));


            },
            onConfirmforUOMChildAssemblyNetWeight: function () {
                let x = this.getCflObject();
                // let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // y.setProperty(`/ChildAssembly/${irowIndex}/UOMName`, x.UnitOfMeasureLongName);

            },
            onCancelforUOMChildAssemblyNetWeight: function () {

            },
            cflForUOMChildAssemblyGrossQty: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("UOM List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["UnitOfMeasure"]);
                this.setCflDataColumns(["UnitOfMeasure"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/GrossQtyUOM`, "UnitOfMeasure", "", "");
                this.setCflSearchProperty("UnitOfMeasure");
                this.showCfl("caddetail_childGrossQtyUOM", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforUOMChildAssemblyGrossQty.bind(this), this.onCancelforUOMChildAssemblyGrossQty.bind(this));


            },
            onConfirmforUOMChildAssemblyGrossQty: function () {
                let x = this.getCflObject();
                // let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // y.setProperty(`/ChildAssembly/${irowIndex}/UOMName`, x.UnitOfMeasureLongName);

            },
            onCancelforUOMChildAssemblyGrossQty: function () {

            },
            cflForProductNo: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Product List");

                //  await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata4/sap/zune_sb_fgapi/srvd_a2x/sap/zune_sd_fgapi/0001/ZUNE_CDS_FGAPI", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Product", "ProductDescription"]);
                this.setCflDataColumns(["Product", "Description"]);
                this.setCflValueAndDisplay("", "", "", "", "");
                this.setCflSearchProperty("Product");
                this.setCflBaseUrlForPagination('/sap/opu/odata4/sap/zune_sb_fgapi/srvd_a2x/sap/zune_sd_fgapi/0001/');
                this.setCflListViewDataSourceProperties("GET", '/sap/opu/odata4/sap/zune_sb_fgapi/srvd_a2x/sap/zune_sd_fgapi/0001/ZUNE_CDS_FGAPI', "", "value");


                this.showCfl("caddetail_productNo", this.getCflListViewDataSourceModelName(), "value", this.onConfirmforProductNo.bind(this), this.onCancelforMaterialCategory.bind(this));


                //  this.showCfl("caddetail_productNo", this.getCflListViewDataSourceModelName(), "d/results",this.onConfirmforProductNo.bind(this) , this.onCancelforProductNo.bind(this));


            },
            onConfirmforProductNo: async function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());

                await this.getChildAssemblyData(x.Product);
                y.setProperty(`/MainAssembly/${irowIndex}/ProductName`, x.Description);
                y.setProperty(`/MainAssembly/${irowIndex}/ProductNo`, x.Product);
                y.setProperty(`/MainAssembly/${irowIndex}/Weight`, x.NetWeight);
                y.setProperty(`/MainAssembly/${irowIndex}/WeightUOMCode`, x.WeightUnit);
                y.setProperty(`/MainAssembly/${irowIndex}/SCIPLCode`, x.ProductOldID);
                y.setProperty(`/MainAssembly/${irowIndex}/PDNumber`, x.PdNo);

                y.setProperty(`/MainAssembly/${irowIndex}/Quantity`, x.Quantity);
                await this.onDimensionOrModelChange(y);
            },
            onCancelforProductNo: function () {

            },
            cflForProductNoSubAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Product List");

                //   await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_PRODUCT_API_CDS/YY1_Product_API", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["Product", "ProductDescription"]);
                this.setCflDataColumns(["Product", "ProductDescription"]);
                this.setCflValueAndDisplay(`/SubAssembly/${rowIndex}/ProductNo`, "Product", "", "");
                this.setCflSearchProperty("Product");
                this.showCfl("caddetail_subProductNo", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforProductNoSubAssembly.bind(this), this.onCancelforProductNoSubAssembly.bind(this));


            },
            onConfirmforProductNoSubAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SubAssembly/${irowIndex}/ProductName`, x.ProductDescription);

            },
            onCancelforProductNoSubAssembly: function () {

            },
            cflForProductNoChildAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Product List");

                // await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product" + "?$expand=to_Description", "", this.getCflListViewDataSourceModelName());
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_PRODUCT_API_CDS/YY1_Product_API", "", this.getCflListViewDataSourceModelName());

                this.setCflDisplayColumns(["Product", "ProductDescription"]);
                this.setCflDataColumns(["Product", "ProductDescription"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/ProductNo`, "Product", "", "");
                this.setCflSearchProperty("Product");
                this.showCfl("caddetail_childProductNo", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforProductNoChildAssembly.bind(this), this.onCancelforProductNoChildAssembly.bind(this));


            },
            onConfirmforProductNoChildAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/ChildAssembly/${irowIndex}/ProductName`, x.ProductDescription);
                y.setProperty(`/ChildAssembly/${irowIndex}/MaterialCategoryCode`, x.ProductType);

            },
            onCancelforProductNoChildAssembly: function () {

            },

            cflForManufacturingProcess: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                irowIndex = rowIndex;
                this.setCflTitle("Manufacturing Process List");

                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_MANUFACTURINGANDOPERAT?$select=SAP_UUID,ManufacturingProcessCode,ManufacturingProcessName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflDataColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflValueAndDisplay(`/MainAssembly/${rowIndex}/ManufacturingName`, "ManufacturingProcessName", "", "");
                this.setCflSearchProperty("ManufacturingProcessName");
                this.showCfl("caddetail_mfgprocess", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforMfgProcess.bind(this), this.onCancelforMfgProcess.bind(this));


            },
            onConfirmforMfgProcess: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/MainAssembly/${irowIndex}/ManufacturingProcessID`, x.SAP_UUID);
                y.setProperty(`/MainAssembly/${irowIndex}/ManufacturingCode`, x.ManufacturingProcessCode);
                //    y.setProperty(`/MainAssembly/${irowIndex}/SAP_UUID`, x.SAP_UUID);

            },
            onCancelforMfgProcess: function () {

            },
            cflForManufacturingProcessSubAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                this.setCflTitle("Manufacturing Process List");

                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_MANUFACTURINGANDOPERAT?$select=SAP_UUID,ManufacturingProcessCode,ManufacturingProcessName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflDataColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflValueAndDisplay(`/SubAssembly/${rowIndex}/ManufacturingName`, "ManufacturingProcessName", "", "");
                this.setCflSearchProperty("ManufacturingProcessName");
                this.showCfl("subMfgprocess", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforMfgProcessSubAssembly.bind(this), this.onCancelforMfgProcessSubAssembly.bind(this));


            },
            onConfirmforMfgProcessSubAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SubAssembly/${irowIndex}/ManufacturingProcessID`, x.SAP_UUID);
                y.setProperty(`/SubAssembly/${irowIndex}/ManufacturingCode`, x.ManufacturingProcessCode);
                //    y.setProperty(`/SubAssembly/${irowIndex}/SAP_UUID`, x.SAP_UUID);
            },
            onCancelforMfgProcessSubAssembly: function () {

            },
            cflForManufacturingProcessChildAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();

                // rowIndex = oEvent.getParent().getBindingContext().rowIndex;

                irowIndex = rowIndex;

                this.setCflTitle("Manufacturing Process List");

                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_MANUFACTURINGANDOPERAT?$select=SAP_UUID,ManufacturingProcessCode,ManufacturingProcessName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflDataColumns(["ManufacturingProcessCode", "ManufacturingProcessName", "SAP_UUID"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/ManufacturingName`, "ManufacturingProcessName", "", "");
                this.setCflSearchProperty("ManufacturingProcessName");
                this.showCfl("caddetail_childMfgprocess", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforMfgProcessChildAssembly.bind(this), this.onCancelforMfgProcessChildAssembly.bind(this));


            },
            onConfirmforMfgProcessChildAssembly: function () {

                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/ChildAssembly/${irowIndex}/ManufacturingProcessID`, x.SAP_UUID);
                y.setProperty(`/ChildAssembly/${irowIndex}/ManufacturingCode`, x.ManufacturingProcessCode);
                //  y.setProperty(`/ChildAssembly/${irowIndex}/SAP_UUID`, x.SAP_UUID);
            },
            onCancelforMfgProcessChildAssembly: function () {

            },
            cflForOperation: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                this.setCflTitle("Operation Symbols List");
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = y.getProperty(`/MainAssembly/${rowIndex}/ManufacturingProcessID`);
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_OPERATION_MANUFACTURINGAND" + "? $filter=SAP_PARENT_UUID eq '" + data + "'&$select=SAP_UUID,SAP_PARENT_UUID,OperationNamewithSymbolsCode,OperationNamewithSymbolsName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflDataColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflValueAndDisplay(`/MainAssembly/${rowIndex}/OperationProcessName`, "OperationNamewithSymbolsName", "", "");
                this.setCflSearchProperty("OperationNamewithSymbolsName");
                this.showCfl("caddetail_opesymbol", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforOperation.bind(this), this.onCancelforOperation.bind(this));

            },
            onConfirmforOperation: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // y.setProperty(`/MainAssembly/${irowIndex}/OperationNameWithSymbols_id`, x.SAP_UUID);
                y.setProperty(`/MainAssembly/${irowIndex}/OperationProcessCode`, x.OperationNamewithSymbolsCode);


            },
            onCancelforOperation: function () {

            },
            cflForOperationSubAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                this.setCflTitle("Operation Symbols List");
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = y.getProperty(`/SubAssembly/${rowIndex}/ManufacturingProcessID`);
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_OPERATION_MANUFACTURINGAND" + "? $filter=SAP_PARENT_UUID eq '" + data + "'&$select=SAP_UUID,SAP_PARENT_UUID,OperationNamewithSymbolsCode,OperationNamewithSymbolsName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflDataColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflValueAndDisplay(`/SubAssembly/${rowIndex}/OperationProcessName`, "OperationNamewithSymbolsName", "", "");
                this.setCflSearchProperty("OperationNamewithSymbolsName");
                this.showCfl("caddetail_subOpesymbol", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforOperationSubAssembly.bind(this), this.onCancelforOperationSubAssembly.bind(this));

            },
            onConfirmforOperationSubAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                //   y.setProperty(`/SubAssembly/${irowIndex}/OperationNameWithSymbols_id`, x.SAP_UUID);
                y.setProperty(`/SubAssembly/${irowIndex}/OperationProcessCode`, x.OperationNamewithSymbolsCode);

            },
            onCancelforOperationSubAssembly: function () {

            },
            cflForOperationChildAssembly: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/").pop();
                this.setCflTitle("Operation Symbols List");
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = y.getProperty(`/ChildAssembly/${rowIndex}/ManufacturingProcessID`);
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/YY1_MANUFACTURINGANDOPERAT_CDS/YY1_OPERATION_MANUFACTURINGAND" + "? $filter=SAP_PARENT_UUID eq '" + data + "'&$select=SAP_UUID,SAP_PARENT_UUID,OperationNamewithSymbolsCode,OperationNamewithSymbolsName", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflDataColumns(["OperationNamewithSymbolsCode", "OperationNamewithSymbolsName", "SAP_UUID", "SAP_PARENT_UUID"]);
                this.setCflValueAndDisplay(`/ChildAssembly/${rowIndex}/OperationProcessName`, "OperationNamewithSymbolsName", "", "");
                this.setCflSearchProperty("OperationNamewithSymbolsName");
                this.showCfl("caddetail_childOpesymbol", this.getCflListViewDataSourceModelName(), "d/results", this.onConfirmforOperationChildAssembly.bind(this), this.onCancelforOperationChildAssembly.bind(this));

            },
            onConfirmforOperationChildAssembly: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                //    y.setProperty(`/ChildAssembly/${irowIndex}/OperationNameWithSymbols_id`, x.SAP_UUID);
                y.setProperty(`/ChildAssembly/${irowIndex}/OperationProcessCode`, x.OperationNamewithSymbolsCode);


            },
            onCancelforOperationChildAssembly: function () {

            },
            CFLforDTPHead: async function () {
                this.setCflTitle("DTP Head List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MUser?$filter=UserRoleCode eq 'DTP_HEAD'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["UserName", "UserGuid"]);
                this.setCflDataColumns(["UserName", "UserGuid"]);
                this.setCflValueAndDisplay("/DTPHeadName", "UserName", "", "");
                this.setCflSearchProperty("UserName");
                this.showCfl("caddetail_caddetailefdtpheadname", this.getCflListViewDataSourceModelName(), "value", this.onConfirmForDTPHead.bind(this), this.onCancelForDTPHead.bind(this));
            },
            onConfirmForDTPHead: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/DTPHead_UserGuid`, x.UserGuid);

            },
            onCancelForDTPHead: function () {
                let x = this.getCflObject();
            },
            validateFields: function () {
                let isValid = true;
                let isValidMainAssembly = true;
                let isValidChildAssembly = true;
                let isValidSubAssembly = true;
                let isValidSeekAdvice = true;
                let oData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let MainAssembly = oData.MainAssembly;
                let ChildAssembly = oData.ChildAssembly;
                let SubAssembly = oData.SubAssembly;
                let SeekAdvice = oData.SeekAdvice;
                if (oData.CrfReqNo == null || oData.CrfReqNo == "") {
                    MessageToast.show("Please select CAD Request No.");
                    isValid = false;
                }
                else if (oData.DTPHeadName == "" || oData.DTPHeadName == null || oData.DTPHeadName == undefined || oData.DTPHead_UserID == "") {
                    MessageToast.show("Please Enter DTP Head");
                    isValid = false;
                }
                if (oData.SeasonProgram == "" || oData.SeasonProgram == null) {
                    isValid = false;
                    MessageToast.show("Please Enter Season/Program field");
                }
                if (oData.CrfReqNo == "") {
                    isValid = false;
                    MessageToast.show("Please Enter Mandatory field");
                }
                if (oSelectDiamension && (oData.Length === '' || oData.TolLength === '' || oData.Width === '' || oData.TolWidth === '' || oData.Height === '' || oData.TolHeight === '')) {
                    isValid = false;
                    MessageToast.show("Please Enter Mandatory field");
                }
                if ((oSelectDiamension === undefined || oSelectDiamension === false) && (oData.Length === '' || oData.TolLength === '' || oData.Width === '' || oData.TolWidth === '' || oData.Height === '' || oData.TolHeight === '')) {
                    isValid = false;
                    MessageToast.show("Please Enter at least 0");
                }
                if (oSelectDiameter && (oData.DiaTop === '' || oData.TolDiaTop === '' || oData.DiaLeft === '' || oData.TolDiaLeft === '' || oData.DiaRight === '' || oData.TolDiaRight === '' || oData.DiaBottom === '')) {
                    isValid = false;
                    MessageToast.show("Please Enter Mandatory field");
                }
                if ((oSelectDiameter === undefined || oSelectDiameter === false) && (oData.DiaTop === '' || oData.TolDiaTop === '' || oData.DiaLeft === '' || oData.TolDiaLeft === '' || oData.DiaRight === '' || oData.TolDiaRight === '' || oData.DiaBottom === '')) {
                    isValid = false;
                    MessageToast.show("Please Enter at least 0");
                }

                for (let index = 0; index < MainAssembly.length; index++) {
                    const item = MainAssembly[index];
                    if (this.isEmpty(item.AssemblyCadNo)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Assembly CAD No in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.AssemblyCadNo)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Assembly CAD No in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.AssemblyCadName)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter AssemblyCadName in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductNo)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Product No in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductName)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Product Name in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ManufacturingName)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter ManufacturingProcess in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.OperationProcessName)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter OperationNameWithSymbols in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.LengthUOM)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Length in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolLengthUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Tol Length in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.WidthUOM)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Width in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWidthUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Tol Width in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.HeightUOM)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Height in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolHeightUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Tol Height in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.DiameterUOM)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Diameter in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolDiameterUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Tol Diameter in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.WeightUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Weight in Main Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWeightUom)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Tol Weight in Main Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.Finish)) {
                        isValidMainAssembly = false;
                        MessageToast.show("Please Enter Finish in Main Assembly at row " + (index + 1));
                        break;
                    }
                }
                for (let index = 0; index < SubAssembly.length; index++) {
                    const item = SubAssembly[index];
                    if (this.isEmpty(item.AssemblyCADNo)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Assembly CAD No in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.AssemblyCadName)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Assembly Cad Name in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductNo)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Product No in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductName)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Product Name in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ManufacturingName)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter ManufacturingProcess in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.OperationProcessName)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter OperationNameWithSymbols in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.LengthUOM)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Length in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolLengthUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Tol Length in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.WidthUOM)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Width in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWidthUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Tol Width in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.HeightUOM)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Height in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolHeightUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Tol Height in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.DiameterUOM)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Diameter in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolDiameterUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Tol Diameter in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.WeightUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Weight in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWeightUom)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Tol Weight in Sub Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.SubAssemblyName)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter SubAssemblyName in Sub Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.Finish)) {
                        isValidSubAssembly = false;
                        MessageToast.show("Please Enter Finish in Sub Assembly at row " + (index + 1));
                        break;
                    }
                }
                for (let index = 0; index < ChildAssembly.length; index++) {
                    const item = ChildAssembly[index];
                    if (this.isEmpty(item.ChildAssemblyName)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter ChildAssembly Name in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.AssemblyCadNo)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Assembly CAD No in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.AssemblyCadName)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Assembly Cad Name in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductNo)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Product No in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ProductName)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Product Name in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.ManufacturingName)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Manufacturing Process in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.OperationProcessName)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Operation Name With Symbols in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.LengthUOM)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Length in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolLengthUom)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Tol Length in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.WidthUOM)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Width in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWidthUom)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Tol Width in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.HeightUOM)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Height in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolHeightUom)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Tol Height in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.DiameterUOM)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Diameter in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolDiameterUom)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Tol Diameter in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.NetWeightUOM)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Weight in Child Assembly at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.TolWeightUom)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Tol Weight in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.ProcessJobworkRate)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Select Process Jobwork Rate in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.NetWeight)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Weight in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.GrossWeight)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Gross Weight in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.GrossQty)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Gross Qty in Child Assembly at row " + (index + 1));
                        break;
                    }
                    // else if (this.isEmpty(item.GrossQtyUOM)) {
                    //     isValidChildAssembly = false;
                    //     MessageToast.show("Please Enter Gross Qty UOM in Child Assembly at row " + (index + 1));
                    //     break;
                    // }
                    else if (this.isEmpty(item.SpecificationDRGSize)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Specification /DRG size in Child Assembly at row " + (index + 1));
                        break;
                    }
                    else if (this.isEmpty(item.Density)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Density in Child Assembly at row " + (index + 1));
                        break;
                    }
                    // else if (this.isEmpty(item.SurfaceArea)) {
                    //     isValidChildAssembly = false;
                    //     MessageToast.show("Please Enter Surface Area in Child Assembly at row " + (index + 1));
                    //     break;
                    // }
                    else if (this.isEmpty(item.Finish)) {
                        isValidChildAssembly = false;
                        MessageToast.show("Please Enter Finish in Child Assembly at row " + (index + 1));
                        break;
                    }


                }

                for (let index = 0; index < SeekAdvice.length; index++) {
                    const item = SeekAdvice[index];
                    if (this.isEmpty(item.DepartmentName)) {
                        isValidSeekAdvice = false;
                        MessageToast.show("Please Enter Department Name in Seek Advice at row " + (index + 1));
                        break;
                    } else if (this.isEmpty(item.UserID.Username)) {
                        isValidSeekAdvice = false;
                        MessageToast.show("Please Enter Username in Seek Advice at row " + (index + 1));
                        break; cflForProductNo

                    }
                    else if (this.isEmpty(item.Question)) {
                        isValidSeekAdvice = false;
                        MessageToast.show("Please Enter  in Seek Advice at row " + (index + 1));
                        break;
                    }
                }

                return isValid && isValidMainAssembly && isValidSubAssembly && isValidChildAssembly && isValidSeekAdvice;
            },
            isEmpty: function (value) {
                return value === null || value === undefined || value === "";
            },
            onSave: async function (saveorsubmit) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                // Fix null → []
                const attachment = oData?.MainAttachment?.Attachment;

                if (!attachment && !Array.isArray(attachment)) {
                    oModel.setProperty("/MainAttachment/Attachment", []);
                }
                // if (!Array.isArray(oData?.MainAttachment?.Attachment)) {

                //     oModel.setProperty("/MainAttachment/Attachment", []);

                // }
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();

                srcObject.SaveOrSubmit = (saveorsubmit === undefined || saveorsubmit === null) ? 'SUBMIT' : saveorsubmit;
                // = this.getFormMode() === '3' ? role.UserID : srcObject.CreatedByUserID_UserGuid;
                // srcObject.loginUserID_UserGuid = loginInfo.UserID;

                let trgObject = this.getView().getModel('saverequest').getData();

                if (this.getFormMode() == '2') {
                    srcObject.ApprovalTransaction.forEach(function (item) {
                        delete item.endDte;
                        delete item.startDte;
                    });
                } else {//add = 3

                    srcObject.ApprovalTransaction = [];
                    srcObject.UserAssign = [];

                }

                this.transferObjectValues(srcObject, trgObject);
                const attachModel = this.getView().getModel('attachResModel')?.getData();
                const attachmentList = attachModel?.value?.flatMap(v => v.AttachmentDataResponse || []) || [];
                const updateAttachments = (attachments, referenceType) => {
                    if (!attachments) return;
                    attachments.forEach(att => {
                        if (att.UploadedOnCloud === "Y" || att.AttachmentGuId) {
                            return;
                        }
                        const match = attachmentList.find(res =>
                            res.AttachmentName === att.AttachmentName &&
                            res.ReferenceType == referenceType
                        );
                        if (match) {
                            const fieldsToCopy = [
                                "AttachmentName",
                                "DelMark",
                                "OrgFileExtension",
                                "OrgFileName",
                                "ReferenceGuid",
                                "ReferenceId",
                                "ReferenceType",
                                "Remarks",
                                "SysFileExtension",
                                "SysFileName",
                                "SysFilePath",
                                "UploadedOnCloud",
                                "createdAt",
                                "createdBy",
                                "dmsFileExtension",
                                "dmsFileId",
                                "dmsFileName",
                                "dmsFolderPath",
                                "dmsRepoId"
                            ];
                            fieldsToCopy.forEach(field => {
                                att[field] = match[field];
                            });
                        }
                    });
                };
                trgObject.InspDraw
                    ?.filter(element => element.RowStatus === "OPEN")
                    .forEach(element => {
                        updateAttachments(element.Attachment, "22");
                    });
                const mainAttachments = Array.isArray(trgObject.MainAttachment)
                    ? trgObject.MainAttachment
                    : trgObject.MainAttachment?.Attachment
                        ? Array.isArray(trgObject.MainAttachment.Attachment)
                            ? trgObject.MainAttachment.Attachment
                            : [trgObject.MainAttachment.Attachment]
                        : [];
                mainAttachments.forEach(element => {
                    if (element?.UploadedOnCloud !== "Y") {
                        updateAttachments(
                            Array.isArray(element.Attachment)
                                ? element.Attachment
                                : element?.Attachment
                                    ? [element.Attachment]
                                    : [],
                            "21"
                        );

                        //delete element.Attachment;

                    }

                });
                console.log('requestObject', trgObject);

                // //temporary comment DMS - Trupti 28102025
                await this.DeleteAttachmentFromDMS();
                let resModel = this.getView()
                    .getModel('attachResModel')
                    ?.getData()
                    .value[0]
                    .AttachmentDataResponse;

                const res21 = resModel?.find(item => item.ReferenceType === "21");

                if (res21) {

                    trgObject.MainAttachment = trgObject.MainAttachment || {};
                    trgObject.MainAttachment.Attachment = trgObject.MainAttachment.Attachment || {};

                    const {
                        AttachmentGuId,   // exclude this
                        ...fieldsToCopy
                    } = res21;
                    trgObject.MainAttachment.Attachment = { ...fieldsToCopy };

                    //Object.assign(trgObject.MainAttachment.Attachment[0], fieldsToCopy);
                }

                await this.onPressOfEntryFormSaveButton(trgObject);
                const res = this.getApiResponseObject();
                if (res.success == true) {
                    if (res.object.SaveOrSubmit === 'SUBMIT') {
                        MessageToast.show('CAD Detail has been Submited Successfully');
                        await this.createNewModelUsingAPI(
                            'GET',
                            `/odata/v4/stoneman-cad/TCadDetail?$expand=Team,Material($filter=DelMark eq 0),MainAttachment($expand=Attachment),InspDraw($expand=User($expand=Role),Attachment)&$filter=CadDetailUUID eq '${res.object.CadDetailUUID}'`,
                            '',
                            'getCadEntryFormDataModel'
                        );
                        // const oModelPDRMDate = this.getView().getModel('getCadEntryFormDataModel').getData();;
                        // await this.onUpdateAttachmentData(oModelPDRMDate.value[0].InspDraw);
                        // await this.onUpdateImageData(oModelPDRMDate.value[0].MainAttachment);


                    } else if (res.object.SaveOrSubmit === 'SAVE') {
                        MessageToast.show('CAD Detail has been Saved Successfully');
                        await this.createNewModelUsingAPI(
                            'GET',
                            `/odata/v4/stoneman-cad/TCadDetail?$expand=Team,Material($filter=DelMark eq 0),MainAttachment($expand=Attachment),InspDraw($expand=User($expand=Role),Attachment)&$filter=CadDetailUUID eq '${res.object.CadDetailUUID}'`,
                            '',
                            'getCadEntryFormDataModel'
                        );
                        // const oModelPDRMDate = this.getView().getModel('getCadEntryFormDataModel').getData();;
                        // await this.onUpdateAttachmentData(oModelPDRMDate.value[0].InspDraw);
                        // await this.onUpdateImageData(oModelPDRMDate.value[0].MainAttachment);


                    } else if (res.object.ApprovalStatus === 'APPROVED' || res.object.ApprovalStatus === 'PENDING') {
                        MessageToast.show('CAD Detail has been Approved Successfully');
                    } else if (res.object.ApprovalStatus === 'REJECTED') {
                        MessageToast.show('CAD Detail has been Rejected Successfully');
                    }

                    setTimeout(
                        function () {
                            this.router.navTo(this.getBackwardRoute());
                        }.bind(this),
                        1000
                    );
                }
                else if (res.object.status == 502) {
                    // this.onFailedSetDateFromatToDisplay();
                    await this.onErrorMessageDialogPress(res.object.responseText);
                    return;
                } else {
                    //  this.onFailedSetDateFromatToDisplay();
                    await this.onErrorMessageDialogPress(res.object.responseJSON.error.details || res.object.responseJSON.error);
                    await this.clearAttachmentFragmentData();
                    return
                }
            },

            onUpdateAttachmentData: async function (res) {

                const attachmentResponse = this.getView().getModel("attachResModel");
                if (attachmentResponse !== undefined) {
                    const attachResData = attachmentResponse.getData();
                    let attachmentData = [];
                    let referenceGuid
                    // Process each entry in `res`
                    res.forEach((resItem) => {
                        if (resItem.RowStatus != 'REFERENCE' && resItem.ReferenceType !== "21") {
                            referenceGuid = resItem.CADAttachmentsGuid || "";
                            // Get the CrfAttachmentsGuid
                            if (attachResData.value && attachResData.value.length > 0) {
                                attachResData.value.forEach((valueItem) => {
                                    if (valueItem.AttachmentDataResponse) {
                                        // Map the attachment data and add it to the result array
                                        const mappedData = valueItem.AttachmentDataResponse.map((attachment) => ({
                                            AttachmentGuId: attachment.AttachmentGuId, // Get from AttachmentDataResponse
                                            ReferenceGuid: referenceGuid, // Use the referenceGuid from resItem
                                        }));
                                        attachmentData = attachmentData.concat(mappedData);
                                    }
                                    return [];
                                });
                            }
                        }
                    });
                    // Wrap the resulting data into the desired structure
                    const finalAttachmentData = { AttachmentData: attachmentData };
                    console.log("Optimized Attachment Data:", attachmentData);
                    if (attachmentData.length != 0) {
                        await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/UpdateAttachmentData", finalAttachmentData, "updateAttachModel");
                        let updateAttachModel = this.getView().getModel("updateAttachModel");
                        let data = updateAttachModel.getData();
                        console.log(data);
                    }
                    await this.clearAttachmentFragmentData();
                }
            },

            clearAttachmentFragmentData: async function () {
                if (this._oDialog1) {
                    this._oDialog1.destroy();
                    this._oDialog1 = undefined; // Clear the reference
                }

                // Clear the associated model data
                const oModelAttachAdd = this.getView().getModel('AttachModel');
                if (oModelAttachAdd) {
                    oModelAttachAdd.setData({ Attachments: [] }); // Reset to empty state
                }
            },

            onRaiseQueryPress: function () {
                var newRow = {
                    isDownloadVisibleSeek: false,
                    isNewRow: true,
                    CADSeekAdviceGuid: null,
                    RowNumber: 1,
                    DepartmentCode: null,
                    DepartmentName: null,
                    QuestionToUser_UserName: null,
                    QuestionToUser_UserGuid: null, //selected user guid
                    Question: null,
                    Answer: null,
                    QuestionFromUser_UserGuid: null, //login user guid
                    Role_RoleGuid: null,
                    Role: {
                        DelMark: null,
                        Description: null,
                        Remarks: null,
                        RoleCode: null,
                        RoleGuid: null
                    }
                };

                let model = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = model.getData();
                this.addRowToModelArray(this.getEntryFormDataSourceModelName(), "SeekAdvice", newRow);
            },

            addChildRow: function () {

                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var data = oModel.getData();
                var rowLen = data.ChildAssembly.length;
                var childAssemblyNo = data.ChildAssembly[0].AssemblyCadNo;
                var childAssemblyName = data.ChildAssembly[0].AssemblyCadName;
                var newRow = {
                    "isNewRow": null,
                    "isDownloadVisibleChild": null,
                    "AssemblyCadAttachment": null,
                    "MaterialCategoryCode": null,
                    "RowNumber": null,
                    "AssemblyCadNo": childAssemblyNo,
                    "AssemblyCadName": childAssemblyName,
                    "ChildAssemblyName": null,
                    "AssemblyCadAttachment_AbsId": null,
                    "ProductNo": null,
                    "ProductName": null,
                    "LengthUOM": null,
                    "TolLengthUom": null,
                    "WidthUOM": null,
                    "TolWidthUom": null,
                    "HeightUOM": null,
                    "TolHeightUom": null,
                    "DiameterUOM": null,
                    "TolDiameterUom": null,
                    "TolWeightUom": null,
                    "SpecificationDRGSize": null,
                    "TolSpecificationDRGSize": null,
                    "Finish": null,
                    "TCadDetailID_CadDetailUUID": null,
                    "Remarks": null,
                    "ManufacturingName": null,
                    "ManufacturingProcessID": null,
                    "ManufacturingCode": null,
                    "OperationProcessName": null,
                    "OperationProcessCode": null,
                    "Density": null,
                    "SurfaceArea": null,
                    "Micron": null,
                    "DFT": null,
                    "ProcessTime": null,
                    "WastagePer": null,
                    "ProcessJobworkRate": null,
                    "NetWeight": null,
                    "NetWeightUOM": null,
                    "WeightUom": null,
                    "GrossWeight": null,
                    "GrossQty": null,
                    "GrossQtyUOM": null,
                    "FinishDimen": null,
                    "UOMCode": null,
                    "UOMName": null,
                    "isDownloadVisibleChild": false
                };
                this.addRowToModelArray(this.getEntryFormDataSourceModelName(), "ChildAssembly", newRow);
            },

            addSubAssmblyRow: function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var data = oModel.getData();
                var rowLen = data.SubAssembly.length;
                var subAssemblyNo = data.SubAssembly[0].AssemblyCADNo;
                var subAssemblyName = data.SubAssembly[0].AssemblyCadName;
                var newRow = {
                    "isNewRow": null,
                    "isDownloadVisibleSub": null,
                    "AssemblyCadAttachment": null,
                    "srNo": 1,
                    "SubAssembly": null,
                    "AssemblyCADNo": subAssemblyNo,
                    "AssemblyCadName": subAssemblyName,
                    "SubAssemblyName": null,
                    "AssemblyCadAttachment_AbsId": null,
                    "ProductNo": null,
                    "ProductName": null,
                    "ManufacturingProcessID": null,
                    "ManufacturingCode": null,
                    "ManufacturingName": null,
                    "OperationNameWithSymbolsID": null,
                    "OperationProcessCode": null,
                    "OperationProcessName": null,
                    "SAP_UUID": null,
                    "OperationNameWithSymbols_id": null,
                    "LengthUOM": null,
                    "TolLengthUom": null,
                    "WidthUOM": null,
                    "TolWidthUom": null,
                    "HeightUOM": null,
                    "TolHeightUom": null,
                    "DiameterUOM": null,
                    "TolDiameterUom": null,
                    "WeightUom": null,
                    "TolWeightUom": null,
                    "SpecificationDRGSize": null,
                    "TolSpecificationDRGSize": null,
                    "Finish": null,
                    "TCadDetailID_CadDetailUUID": null,
                    "Remarks": null,
                    "RowNumber": null,
                    "isDownloadVisibleSub": false
                };
                this.addRowToModelArray(this.getEntryFormDataSourceModelName(), "SubAssembly", newRow);

            }, onDeleteSeekAdvice: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), "SeekAdvice", iIndex)
            },
            onDeleteChild: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), "ChildAssembly", iIndex)
            },
            onDeleteSubAssmbly: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), "SubAssembly", iIndex)
            },

            onDeleteMaterial: function (oEvent) {

                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), "Material", iIndex);

            },
            addMaterialRow: function () {

                var newRow = {
                    "MaterialAutoCode": "Material 1",
                    "MaterialCatHanaText": null,
                    "MaterialCatFreeText": null,
                    "Remarks": null,
                    "RowNumber": 1,
                    "IsActive": null,
                    "DelMark": null,
                    "MaterialID": null
                };
                this.addRowToModelArray(this.getEntryFormDataSourceModelName(), "Material", newRow);


            },

            addRowToModelArray: function (modelName, arrayName, newRow) {
                // Get the view's model
                let model = this.getView().getModel(modelName);

                // Get the data from the model
                let data = model.getData();

                // Check if the specified array exists in the data
                if (Array.isArray(data[arrayName])) {
                    let rowLen = data[arrayName].length; // Get the length of the array

                    // Increment the srNo property based on the current length
                    newRow.RowNumber = rowLen > 0 ? rowLen + 1 : 1;
                    if (arrayName == "Material") { newRow.MaterialAutoCode = "Material " + (rowLen + 1); }
                    // Add the new row to the specified array
                    data[arrayName].push(newRow);

                    // Set the updated data back to the model
                    model.setData(data);

                    // Update the view with the model (if necessary)
                    this.getView().setModel(modelName, model);
                } else {
                    console.error(`Array ${arrayName} does not exist in the model data.`);
                }
            },
            openDialog: function (oEvent) {
                var oView = this.getView();
                var oSelectedRowContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName()); // Get the selected row context

                // Retrieve the data from the selected row
                var oModel = oSelectedRowContext.getModel();
                var sPath = oSelectedRowContext.getPath();
                var oSelectedData = oModel.getProperty(sPath);
                var dialog = new SeekAdviceCommentDialog(oView, "Query", "Query", this);
                //dialog.open();
                var oEventSource = oEvent.getSource();
                var oTableRow = oEventSource.getParent();
                var oTable = oTableRow.getParent();
                var iRowIndex = oTable.indexOfItem(oTableRow);
                console.log("Row Index:", iRowIndex);

                this._iRowIndex = iRowIndex;
                this._oSelectedRowContext = oSelectedRowContext;
                dialog.open(oSelectedRowContext, oSelectedData);
            },
            handleFragmentSelection: async function (sReplyValue) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty(this._oSelectedRowContext.getPath() + "/Answer", sReplyValue);
                let guid = oModel.getProperty(this._oSelectedRowContext.getPath()).CADSeekAdviceGuid
                let payload = {
                    Answer: oModel.getProperty(this._oSelectedRowContext.getPath()).Answer
                }
                await this.createNewModelUsingAPI(
                    'PATCH',
                    `/odata/v4/stoneman-cad/TCadSeekAdvice('${guid}')`,
                    payload,
                    'SavedSeekAdviceModel'
                );

            },
            openDialogApprove: function (oEvent) {
                var oView = this.getView();
                var oModelData = oView.getModel(this.getEntryFormDataSourceModelName()).getData();
                var dialog = new ApproveRejectFragment(oView, "Comment", "APPROVED", this, oModelData);
                dialog.open();
            },
            openDialogReject: function (oEvent) {
                var oView = this.getView();
                var oModelData = oView.getModel(this.getEntryFormDataSourceModelName()).getData();
                var dialog = new ApproveRejectFragment(oView, "Comment", "REJECTED", this, oModelData);
                dialog.open();
            },
            handleFragmentSelectionApproveReject: function (sReplyValue) {

                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty("/Answer", sReplyValue);

            },
            getApproveRejectComment: function (sReplyValue) {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty("/newApprovalComment", sReplyValue.Comment);
                oModel.setProperty("/newApprovalStatus", sReplyValue.Status);
                //this.onSave();

                // if (oData.CrfStageCode === 'CRF_BUYER_APPROVAL_PENDING') {
                //     this.onSaveNew(null);
                // } else {
                //     this.onUploadPress();
                // }
                this.onUploadPress();

            },
            onFileChangeMainAssembly: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter("files"); // Get all selected files
                var oTable = this.byId("caddetail_mainAssemblyTable");
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                var aAllowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
                if (aAllowedFileTypes.indexOf(aFiles[0].type) === -1) {
                    MessageToast.show("Please upload a PDF or image file.");
                    oFileUploader.setValue("");
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024;
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show("File size exceeds the limit of 10MB.");
                    oFileUploader.setValue("");
                    return;
                }
                if (aFiles.length) {
                    for (var i = 0; i < aFiles.length; i++) {
                        this._readFileAsBase64MainAssembly(aFiles[i], iRowIndex, i);
                    }
                    //this._readFileAsBase64MainAssembly(aFiles[iRowIndex], iRowIndex);
                }
                else {
                    MessageToast.show("No file selected");
                }
            },

            _readFileAsBase64MainAssembly: function (oFile, iRowIndex, iIndex) {
                this._aBase64FilesMainAssembly = [];
                var reader = new FileReader();
                reader.onload = function (event) {
                    var base64String = event.target.result.split(",")[1]; // Remove the Data URL prefix

                    var fileData = {
                        extension: oFile.type.split("/")[1],
                        fileName: oFile.name.split(".")[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64FilesMainAssembly = fileData;

                    if (iIndex == iRowIndex) {
                        MessageToast.show("File Upload successfully: " + fileData.fileName);
                    }
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show("Error reading file: " + error);
                };
                reader.readAsDataURL(oFile);
            },

            onFileChangeSubAssembly: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter("files"); // Get all selected files

                var oTable = this.byId("caddetail_subAssemblyTable");
                let iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                this._fileDataSub[iRowIndex] = {};
                // Store the file data for the specific row
                this._fileDataSub[iRowIndex] = aFiles[0];
                var aAllowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

                if (aAllowedFileTypes.indexOf(aFiles[0].type) === -1) {
                    MessageToast.show("Please upload a PDF or image file.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024; // 5MB in bytes
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show("File size exceeds the limit of 10MB.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }
                if (!this._aBase64FilesSubAssembly) {
                    this._aBase64FilesSubAssembly = [];
                }

                // Read files as base64

                // if (this._fileDataSub.length) {
                // for (var i = 0; i < this._fileDataSub.length; i++) {
                //     this._aBase64FilesSubAssembly[i] = {
                //         extension: null,
                //         fileName: null,
                //         fileSize: null,
                //         displayName: null,
                //         base64String: null
                //     };
                // }
                //this._readFileAsBase64SubAssembly(this._fileData[iRowIndex], iRowIndex);
                // }
                // else {
                //     MessageToast.show("No file selected");
                // }
                this._readFileAsBase64SubAssembly(this._fileDataSub[iRowIndex], iRowIndex, iRowIndex);
            },
            _readFileAsBase64SubAssembly: function (oFile, iIndex, iRowIndex) {

                if (!oFile) {
                    this._aBase64FilesSubAssembly[iIndex] = {
                        extension: null,
                        fileName: null,
                        fileSize: null,
                        displayName: null,
                        base64String: null
                    };
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (event) {
                    var base64String = event.target.result.split(",")[1]; // Remove the Data URL prefix
                    var fileData = {
                        extension: oFile.type.split("/")[1],
                        fileName: oFile.name.split(".")[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64FilesSubAssembly[iIndex] = fileData;


                    MessageToast.show("File Upload successfully: " + fileData.fileName);

                    return
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show("Error reading file: " + error);
                };
                reader.readAsDataURL(oFile);
            },
            onFileChangeChildAssembly: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter("files"); // Get all selected files

                var oTable = this.byId("caddetail_childAssemblyTable");
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());

                // Store the file data for the specific row
                this._fileDataChild[iRowIndex] = aFiles[0];
                var aAllowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

                if (aAllowedFileTypes.indexOf(aFiles[0].type) === -1) {
                    MessageToast.show("Please upload a PDF or image file.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024; // 5MB in bytes
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show("File size exceeds the limit of 10MB.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }
                if (!this._aBase64FilesChildAssembly) {
                    this._aBase64FilesChildAssembly = [];
                }

                // Read files as base64


                // for (var i = 0; i < this._fileDataChild.length; i++) {

                //     this._aBase64FilesChildAssembly[i] = {
                //         extension: null,
                //         fileName: null,
                //         fileSize: null,
                //         displayName: null,
                //         base64String: null
                //     };

                // }
                //this._readFileAsBase64ChildAssembly(this._fileData[iRowIndex], iRowIndex);

                // }
                // else {
                //     MessageToast.show("No file selected");
                // }
                this._readFileAsBase64ChildAssembly(this._fileDataChild[iRowIndex], iRowIndex, iRowIndex);
            },
            _readFileAsBase64ChildAssembly: function (oFile, iIndex, iRowIndex) {

                if (!oFile) {
                    this._aBase64FilesChildAssembly[iIndex] = {
                        extension: null,
                        fileName: null,
                        fileSize: null,
                        displayName: null,
                        base64String: null
                    };
                    return;
                }
                var reader = new FileReader();

                reader.onload = function (event) {
                    var base64String = event.target.result.split(",")[1]; // Remove the Data URL prefix
                    var fileData = {
                        extension: oFile.type.split("/")[1],
                        fileName: oFile.name.split(".")[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };

                    this._aBase64FilesChildAssembly[iIndex] = fileData;

                    MessageToast.show("File Upload successfully: " + oFile.name);

                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show("Error reading file: " + error);
                };
                reader.readAsDataURL(oFile);

            },

            onFileChangeSeekAdvice: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter("files"); // Get all selected files

                var oTable = this.byId("caddetail_cad_seekAdviceTable");
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());

                // Store the file data for the specific row
                this._fileDataSeek[iRowIndex] = aFiles[0];
                var aAllowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

                if (aAllowedFileTypes.indexOf(aFiles[0].type) === -1) {
                    MessageToast.show("Please upload a PDF or image file.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024; // 5MB in bytes
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show("File size exceeds the limit of 10MB.");
                    oFileUploader.setValue(""); // Clear the FileUploader
                    return;
                }
                if (!this._aBase64FilesSeekAdvice) {
                    this._aBase64FilesSeekAdvice = [];
                }

                // Read files as base64

                // if (this._fileDataSeek.length) {
                // for (var i = 0; i < this._fileDataSeek.length; i++) {
                //         if( this._fileDataSeek[i]==null || this._fileDataSeek[i]== undefined || Object.keys(this._fileDataSeek[i]).length==0 )
                //   {  this._aBase64FilesSeekAdvice[i] = {
                //         extension: null,
                //         fileName: null,
                //         fileSize: null,
                //         displayName: null,
                //         base64String: null
                //     };
                // }

                // }

                this._readFileAsBase64SeekAdvice(this._fileDataSeek[iRowIndex], iRowIndex, iRowIndex);


            },

            _readFileAsBase64SeekAdvice: function (oFile, iIndex, iRowIndex) {
                if (!oFile) {
                    this._aBase64FilesSeekAdvice[iIndex] = {
                        extension: null,
                        fileName: null,
                        fileSize: null,
                        displayName: null,
                        base64String: null
                    };
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (event) {
                    var base64String = event.target.result.split(",")[1]; // Remove the Data URL prefix
                    var fileData = {
                        extension: oFile.type.split("/")[1],
                        fileName: oFile.name.split(".")[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64FilesSeekAdvice[iIndex] = fileData;
                    MessageToast.show("File Upload successfully: " + oFile.name);
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show("Error reading file: " + error);
                };
                reader.readAsDataURL(oFile);

            },
            onDownloadFile: async function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().getParent().indexOfItem(oEvent.getSource().getParent().getParent());
                var oView = this.getView();
                var oModel = oView.getModel(this.getEntryFormDataSourceModelName());
                var oDataAttachment = oModel.getProperty("/InspDraw/" + this.iRowAttachmentIndex); // Adjust path based on your model structure
                var oDataSeekAdvice = oModel.getProperty("/SeekAdvice/" + this.iRowAttachmentIndex);
                var oDataMainAssembly = oModel.getProperty("/MainAssembly/" + this.iRowAttachmentIndex);
                var oDataSubAssembly = oModel.getProperty("/SubAssembly/" + this.iRowAttachmentIndex);
                var oDataChildAssembly = oModel.getProperty("/ChildAssembly/" + this.iRowAttachmentIndex);// Adjust path based on your model structure
                var oButton = oEvent.getSource();
                var sButtonId = oButton.getId();


                // if (sButtonId.includes('caddetail_downloadBtn')) {
                //     var payload = {
                //         ID: oDataAttachment.InspRefDocAbsId_AbsId
                //     };
                // }
                // if (sButtonId.includes('caddetail_downloadBtn1')) {
                //     var payload = {
                //         ID: oDataAttachment.DraftAttachmentAbsId_AbsId
                //     };
                // }

                // if (sButtonId.includes('caddetail_seekDownloadBtn')) {
                //     var payload = {
                //         ID: oDataSeekAdvice.SeekAdviceDocAbsId_AbsId
                //     };
                // }
                // if (sButtonId.includes('caddetail_mainDownloadBtn')) {
                //     var payload = {
                //         ID: oDataMainAssembly.AssemblyCadAttachment_AbsId
                //     };
                // }
                // if (sButtonId.includes('caddetail_subDownloadBtn')) {
                //     var payload = {
                //         ID: oDataSubAssembly.AssemblyCadAttachment_AbsId
                //     };
                // }
                // if (sButtonId.includes('caddetail_childDownloadBtn')) {
                //     var payload = {
                //         ID: oDataChildAssembly.AssemblyCadAttachment_AbsId
                //     };
                // }

                if (oModel.getProperty('/isMainAssembly')) {
                    var payload = {
                        ID: oDataMainAssembly.AssemblyCadAttachment[iIndex].AttachmentGuId
                    };
                }
                if (oModel.getProperty('/isSubAssembly')) {
                    var payload = {
                        ID: oDataSubAssembly.AssemblyCadAttachment[iIndex].AttachmentGuId
                    };
                }
                if (oModel.getProperty('/isChildAssembly')) {
                    var payload = {
                        ID: oDataChildAssembly.AssemblyCadAttachment[iIndex].AttachmentGuId
                    };
                }
                if (oModel.getProperty('/isSeekAdvise')) {
                    var payload = {
                        ID: oDataSeekAdvice.AssemblyCadAttachment[iIndex].AttachmentGuId
                    };
                }
                if (oModel.getProperty('/isInspDraw')) {
                    var payload = {
                        ID: oDataAttachment.Attachment[iIndex].AttachmentGuId
                    };
                }


                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DGetAttachmentDataWithFile", payload, "downloadAttachModel");
                let downloadAttachModel = this.getView().getModel("downloadAttachModel");
                let data = downloadAttachModel.getData();

                var sBase64 = data.value.Base64File;
                var sFileType = data.value.OrgFileExtension;
                var actualFileName = data.value.AttachmentName;

                // Convert base64 to binary (Blob)
                var byteCharacters = atob(sBase64);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: sFileType });
                // Create a Blob URL and trigger download
                var sBlobUrl = URL.createObjectURL(blob);
                var aLink = document.createElement('a');
                aLink.href = sBlobUrl;
                aLink.download = actualFileName //+ sFileType; // Assuming file extension is part of sFileType
                aLink.click();
                MessageToast.show("File downloaded successfully.");
            },
            onViewFile: async function (oEvent) {
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                if (oMainModel.isSeekAdvise === true) {
                    await this.onViewFileHandler(oEvent, "/SeekAdvice");
                }
                else {
                    await this.onViewFileHandler(oEvent, "/InspDraw");
                }
            },
            // onViewFile: async function (oEvent) {
            //     var iIndex = oEvent.getSource().getParent().getParent().getParent().indexOfItem(oEvent.getSource().getParent().getParent());
            //     var oView = this.getView();
            //     var oModel = oView.getModel(this.getEntryFormDataSourceModelName());
            //     var oDataAttachment = oModel.getProperty("/InspDraw/" + iIndex);
            //     var oDataSeekAdvice = oModel.getProperty("/SeekAdvice/" + iIndex);
            //     var oDataMainAssembly = oModel.getProperty("/MainAssembly/" + iIndex);
            //     var oDataSubAssembly = oModel.getProperty("/SubAssembly/" + iIndex);
            //     var oDataChildAssembly = oModel.getProperty("/ChildAssembly/" + iIndex);// Adjust path based on your model structure
            //     var oButton = oEvent.getSource();
            //     var sButtonId = oButton.getId();
            //     if (sButtonId.includes('caddetail_viewBtn')) {
            //         var payload = {
            //             ID: oDataAttachment.InspRefDocAbsId_AbsId
            //         };
            //     }
            //     if (sButtonId.includes('caddetail_viewBtn1')) {
            //         var payload = {
            //             ID: oDataAttachment.DraftAttachmentAbsId_AbsId
            //         };
            //     }

            //     if (sButtonId.includes('caddetail_seekAttachBtn')) {
            //         var payload = {
            //             ID: oDataSeekAdvice.SeekAdviceDocAbsId_AbsId
            //         };
            //     }
            //     if (sButtonId.includes('caddetail_mainAttachBtn')) {
            //         var payload = {
            //             ID: oDataMainAssembly.AssemblyCadAttachment_AbsId
            //         };
            //     }
            //     if (sButtonId.includes('caddetail_subAttachBtn')) {
            //         var payload = {
            //             ID: oDataSubAssembly.AssemblyCadAttachment_AbsId
            //         };
            //     }
            //     if (sButtonId.includes('caddetail_childAttachBtn')) {
            //         var payload = {
            //             ID: oDataChildAssembly.AssemblyCadAttachment_AbsId
            //         };
            //     }



            //     // Make AJAX call to get the file

            //     await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/GetAttachmentDataWithFile", payload, "viewAttachModel");
            //     let viewAttachModel = this.getView().getModel("viewAttachModel");
            //     let data = viewAttachModel.getData();


            //     var sBase64 = data.value.Base64File; // Adjust based on your API response
            //     var sFileType = data.value.FileExtension; // Adjust based on your API response

            //     // Create a Blob object from the base64 string
            //     var byteCharacters = atob(sBase64);
            //     var byteNumbers = new Array(byteCharacters.length);
            //     for (var i = 0; i < byteCharacters.length; i++) {
            //         byteNumbers[i] = byteCharacters.charCodeAt(i);
            //     }
            //     var byteArray = new Uint8Array(byteNumbers);
            //     var blob = new Blob([byteArray], { type: sFileType });

            //     // Create a URL for the Blob
            //     var sBlobUrl = URL.createObjectURL(blob);

            //     // Display the attachment based on the file type
            //     if (sFileType === ".pdf") {
            //         var byteArray = new Uint8Array(byteNumbers);
            //         var blob = new Blob([byteArray], { type: 'application/pdf' });
            //         var sBlobUrl = URL.createObjectURL(blob);
            //         var oPDFViewer = new PDFViewer();
            //         this.getView().addDependent(oPDFViewer);
            //         oPDFViewer.setSource(sBlobUrl);
            //         oPDFViewer.open();
            //     }
            //     else if ((sFileType === ".png" || sFileType === ".avif" || sFileType === ".jpg" || sFileType === ".jpeg")) {
            //         var oDialog = new Dialog({
            //             title: "View Attachment",
            //             content: new Image({
            //                 src: sBlobUrl,
            //                 width: "100%",
            //                 height: "100%"
            //             }),
            //             endButton: new sap.m.Button({
            //                 text: "Close",
            //                 press: function () {
            //                     oDialog.close();
            //                 }
            //             })
            //         });
            //         oDialog.open();
            //     }



            // },

            onUploadPress: async function (oEvent) {
                //call attachment api
                var oPayload = [];
                var ChildAssembly = [];
                var SubAssembly = [];
                var MainAssembly = [];
                var AttachmentData = [];
                var SeekAdvice = [];
                absIDSeekAdvice = [];
                absIDSubAssembly = [];
                absIDChildAssembly = [];
                absIDMainAssembly = null;
                AttachmentData = [];
                let saveorsubmit;

                (this._aBase64FilesMultiple || []).forEach(function (oFile, index) {
                    AttachmentData[index] = {

                        AttachmentGuId: null,
                        AttachmentName: oFile.AttachmentName,
                        OrgFileName: oFile.AttachmentName.split(".")[0],
                        OrgFileExtension: oFile.OrgFileExtension,
                        SysFileName: "",
                        SysFileExtension: oFile.OrgFileExtension,
                        ReferenceType: "22",
                        ReferenceId: null,
                        ReferenceGuid: "",
                        SysFilePath: "",
                        Base64File: oFile.fileBase64
                    }
                });
                const att = this._aBase64FileSingle?.[0]

                if (att) {

                    AttachmentData.push({
                        AttachmentGuId: null,
                        AttachmentName: att.AttachmentName,
                        OrgFileName: att.AttachmentName.split(".")[0],
                        OrgFileExtension: att.OrgFileExtension,
                        SysFileName: "",
                        SysFileExtension: att.OrgFileExtension,
                        ReferenceType: "21",
                        ReferenceId: null,
                        ReferenceGuid: "",
                        SysFilePath: "",
                        Base64File: att.fileBase64
                    });

                }
                //   AttachmentData = [...MainAssembly, ...SubAssembly, ...ChildAssembly];

                oPayload = {
                    AttachmentData
                };
                console.log(oPayload);

                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var oData = oModel.getData();


                if (oEvent) {
                    var oButton = oEvent.getSource();
                    // Check the ID or any other attribute of the button to identify it
                    var sButtonId = oButton.getId();
                    var sButtonBaseId = sButtonId.split("--").pop();
                    if (sButtonBaseId === "caddetail_btnSave") {
                        saveorsubmit = "SAVE";
                    } else if (sButtonBaseId === "caddetail_btnSubmit") {
                        saveorsubmit = "SUBMIT";
                        if (!this.validateAssemblies(oData)) {
                            return; // Stop processing if validation fails
                        }
                    }
                    oModel.setProperty("/SaveOrSubmit", saveorsubmit);
                }

                let isValid = (oPayload.AttachmentData.length !== 0);
                if (isValid) {
                    await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-attachment/DAttachments', oPayload, 'attachResModel');
                    let attachModel = this.getView().getModel('attachResModel').getData();
                    console.log(attachModel);
                    oModel.setData(oData);

                    this.onSave(saveorsubmit);
                }
                else {
                    this.onSave(saveorsubmit);
                }


                /*if (oData.SubAssembly) {
                    oData.SubAssembly.forEach(function (item, index) {
        
                        if (index < absIDSubAssembly.length && absIDSubAssembly[index] != undefined) {
                            item.AssemblyCadAttachment_AbsId = absIDSubAssembly[index];
                        }
                        else if (index < absIDSubAssembly.length && absIDSubAssembly[index] === undefined) {
                            item.AssemblyCadAttachment_AbsId = item.AssemblyCadAttachment_AbsId;
                        }
                        item.DiameterUOM = Number(oData.SubAssembly[index].DiameterUOM);
                        item.HeightUOM = Number(oData.SubAssembly[index].HeightUOM);
                        item.LengthUOM = Number(oData.SubAssembly[index].LengthUOM);
                        item.TolDiameterUom = Number(oData.SubAssembly[index].TolDiameterUom);
                        item.TolHeightUom = Number(oData.SubAssembly[index].TolHeightUom);
                        item.TolLengthUom = Number(oData.SubAssembly[index].TolLengthUom);
                        item.TolWeightUom = Number(oData.SubAssembly[index].TolWeightUom);
                        item.TolWidthUom = Number(oData.SubAssembly[index].TolWidthUom);
                        item.WeightUom = Number(oData.SubAssembly[index].WeightUom);
                        item.WidthUOM = Number(oData.SubAssembly[index].WidthUOM);
        
                        delete oData.SubAssembly[index].ManufacturingProcess;
                        delete oData.SubAssembly[index].srNo;
                        delete oData.SubAssembly[index].SubAssembly;
                        delete oData.SubAssembly[index].ManufacturingProcess_ID;
                        delete oData.SubAssembly[index].OperationNameWithSymbols_id;
                        delete oData.SubAssembly[index].SAP_UUID;
                        delete oData.SubAssembly[index].isNewRow;
                        delete oData.SubAssembly[index].isDownloadVisibleSub;
                        delete oData.SubAssembly[index].AssemblyCadAttachment;
                    })
                }
                else {
                    oData.SubAssembly = null;
                }
                if (oData.ChildAssembly) {
                    oData.ChildAssembly.forEach(function (item, index) {
                        if (index < absIDChildAssembly.length && absIDChildAssembly[index] != undefined) {
                            item.AssemblyCadAttachment_AbsId = absIDChildAssembly[index];
                        }
                        else if (index < absIDChildAssembly.length && absIDChildAssembly[index] === undefined) {
                            item.AssemblyCadAttachment_AbsId = item.AssemblyCadAttachment_AbsId;
                        }
                        item.Density = Number(oData.ChildAssembly[index].Density);
                        item.DFT = Number(oData.ChildAssembly[index].DFT);
                        item.DiameterUOM = Number(oData.ChildAssembly[index].DiameterUOM);
                        item.GrossQty = Number(oData.ChildAssembly[index].GrossQty);
                        item.GrossWeight = Number(oData.ChildAssembly[index].GrossWeight);
                        item.HeightUOM = Number(oData.ChildAssembly[index].HeightUOM);
                        item.LengthUOM = Number(oData.ChildAssembly[index].LengthUOM);
                        item.Micron = Number(oData.ChildAssembly[index].Micron);
                        item.NetWeight = Number(oData.ChildAssembly[index].NetWeight);
                        item.SpecificationDRGSize = Number(oData.ChildAssembly[index].SpecificationDRGSize);
                        item.SurfaceArea = Number(oData.ChildAssembly[index].SurfaceArea);
                        item.TolDiameterUom = Number(oData.ChildAssembly[index].TolDiameterUom);
                        item.TolHeightUom = Number(oData.ChildAssembly[index].TolHeightUom);
                        item.TolLengthUom = Number(oData.ChildAssembly[index].TolLengthUom);
                        item.TolWeightUom = Number(oData.ChildAssembly[index].TolWeightUom);
                        item.TolWidthUom = Number(oData.ChildAssembly[index].TolWidthUom);
                        item.WastagePer = Number(oData.ChildAssembly[index].WastagePer);
                        item.WidthUOM = Number(oData.ChildAssembly[index].WidthUOM);
        
                        delete oData.ChildAssembly[index].ManufacturingProcess;
                        delete oData.ChildAssembly[index].srNo;
                        delete oData.ChildAssembly[index].ChildAssembly;
                        delete oData.ChildAssembly[index].ManufacturingProcess_ID;
                        delete oData.ChildAssembly[index].OperationNameWithSymbols_id;
                        delete oData.ChildAssembly[index].SAP_UUID;
                        delete oData.ChildAssembly[index].isNewRow;
                        delete oData.ChildAssembly[index].isDownloadVisibleChild;
                        delete oData.ChildAssembly[index].AssemblyCadAttachment;
                    })
                }
                else {
                    oData.ChildAssembly = null
                }
        
        
                if (oData.SeekAdvice) {
                    oData.SeekAdvice.forEach(function (item, index) {
                        if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] != undefined) {
                            item.SeekAdviceDocAbsId_AbsId = absIDSeekAdvice[index];
                        }
                        else if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] === undefined) {
                            item.SeekAdviceDocAbsId_AbsId = item.SeekAdviceDocAbsId_AbsId;
                        }
                        delete oData.SeekAdvice[index].isDownloadVisibleSeek;
                        delete oData.SeekAdvice[index].isNewRow;
                        delete oData.SeekAdvice[index].srNo;
                    })
        
                }
                else {
                    oData.SeekAdvice = null
                }
                if (oData.Material) {
                    oData.Material.forEach(function (item, index) {
        
                        delete oData.Material[index].CrfReqID_CrfReqUUID;
                        delete oData.Material[index].createdAt;
                        delete oData.Material[index].createdBy;
                        delete oData.Material[index].modifiedAt;
                        delete oData.Material[index].modifiedBy;
                        delete oData.Material[index].MaterialID;
        
                    })
        
        
                }
                oModel.setData(oData);
                this.getView().setModel(this.getEntryFormDataSourceModelName(), oModel);
        
                let oModel1 = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData1 = oModel1.getData();
        
                if (this.getFormMode() == "3") {
                    oModel1.setProperty("/CreatedByUserID_UserID", loginInfo.UserID);
                }
        
        
                oModel1.setProperty("/loginUserID_UserID", loginInfo.UserID);
                oModel1.setProperty("/FormType", "CAD");
        
        
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel("saverequest").getData();
                console.log("srcObject ====================================>", srcObject)
                console.log("trgObject ====================================>", trgObject)
                this.transferObjectValues(srcObject, trgObject);
        
                await this.onPressOfEntryFormSaveButton(trgObject);
                const res = this.getApiResponseObject();
                if (res.success === true && this.getFormMode() == "3") {
                    {
                        MessageToast.show("CAD created successfully " + res.object.CadDetailNo);
                        setTimeout(function () {
                            this.router.navTo(this.getBackwardRoute());
                        }.bind(this), 500);
                    }
                }
                else if (res.success === true && this.getFormMode() == "2") {
                    MessageToast.show("CAD updated successfully " + res.object.CadDetailNo);
                    setTimeout(function () {
                        this.router.navTo(this.getBackwardRoute());
                    }.bind(this), 500);
                }
                else {
                    MessageToast.show(res.object.responseJSON.error.message);
                }*/

                // let response = this.getView().getModel(this.getEntryFormResponseDataSourceModelName()).getData();
                // if (response && this.getFormMode() == "3") {
                //     MessageToast.show("CAD created successfully " + response.CadDetailNo);
                //     setTimeout(function () {
                //         this.router.navTo(this.getBackwardRoute());
                //     }.bind(this), 500);
                // }
                // else if (response && this.getFormMode() == "2") {
                //     MessageToast.show("CAD updated successfully " + response.CadDetailNo);
                //     setTimeout(function () {
                //         this.router.navTo(this.getBackwardRoute());
                //     }.bind(this), 500);
                // }

            },


            onTabSelect: function () {
                var oTable = this.byId("caddetail_mainAssemblyTable"); // Replace with your table's ID

                var oScrollContainer = this.byId("caddetail_scrollcontainerMain");

                // Use setTimeout to ensure it runs after the tab content is fully loaded
                oScrollContainer.addEventDelegate({
                    onAfterRendering: function () {
                        var oScrollContainerDomRef = oScrollContainer.getDomRef();
                        var oTableDomRef = oTable.getDomRef();

                        if (oScrollContainerDomRef && oTableDomRef) {

                            oScrollContainerDomRef.scrollLeft = 0;

                        }
                    }.bind(this)
                });

                var oTable2 = this.byId("caddetail_subAssemblyTable"); // Replace with your table's ID

                var oScrollContainer2 = this.byId("caddetail_scrollcontainerSub");

                // Use setTimeout to ensure it runs after the tab content is fully loaded
                oScrollContainer2.addEventDelegate({
                    onAfterRendering: function () {
                        var oScrollContainerDomRef = oScrollContainer2.getDomRef();
                        var oTableDomRef = oTable2.getDomRef();

                        if (oScrollContainerDomRef && oTableDomRef) {

                            oScrollContainerDomRef.scrollLeft = 0;

                        }
                    }.bind(this)
                });
                var oTable3 = this.byId("caddetail_childAssemblyTable"); // Replace with your table's ID

                var oScrollContainer3 = this.byId("caddetail_scrollcontainerChild");

                // Use setTimeout to ensure it runs after the tab content is fully loaded
                oScrollContainer3.addEventDelegate({
                    onAfterRendering: function () {
                        var oScrollContainerDomRef = oScrollContainer3.getDomRef();
                        var oTableDomRef = oTable3.getDomRef();

                        if (oScrollContainerDomRef && oTableDomRef) {

                            oScrollContainerDomRef.scrollLeft = 0;

                        }
                    }.bind(this)
                });
            },

            ValidateSeekAdvice: function (SeekAdvice) {
                let isValidSeekAdvice = true;
                for (let index = 0; index < SeekAdvice.length; index++) {
                    const item = SeekAdvice[index];
                    if (this.isEmpty(item.QuestionToUser_UserGuid)) {
                        isValidSeekAdvice = false;
                        MessageToast.show('Please Enter User Name at row ' + (index + 1));
                        break;
                    }
                    // else if (this.isEmpty(item.Question)) {
                    //     isValidSeekAdvice = false;
                    //     MessageToast.show('Please Enter Query at row ' + (index + 1));
                    //     break;
                    // }
                }
                return isValidSeekAdvice;
            },

            createObjectTarget: function () {
                const x = {
                    CadDetailUUID: null,
                    SaveOrSubmit: null,
                    SeekAdvice: [
                        {
                            CADSeekAdviceGuid: null,
                            RowNumber: null,
                            DepartmentCode: null,
                            DepartmentName: null,
                            QuestionToUser_UserGuid: null,
                            Question: null,
                            Answer: null,
                            QuestionFromUser_UserGuid: null,
                            Role_RoleGuid: null
                        }
                    ]
                };

                return x;
            },

            onUploadPressSeekAdvice: async function () {
                const oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const oData = oModel.getData();
                var SeekAdvice = [];
                var AttachmentData = [];
                // Validate the SeekAdvice data
                if (this.ValidateSeekAdvice(oData.SeekAdvice)) {
                    let oPayload = [];
                    // Consolidate all attachments from the SeekAdvice table

                    this._aBase64FilesSeekAdvice.forEach(function (oFile, index) {
                        SeekAdvice[index] =
                        {
                            AttachmentGuId: null,
                            AttachmentName: oFile.AttachmentName,
                            OrgFileName: oFile.AttachmentName.split(".")[0],
                            OrgFileExtension: oFile.OrgFileExtension,
                            SysFileName: "",
                            SysFileExtension: oFile.OrgFileExtension,
                            ReferenceType: "41",
                            ReferenceId: null,
                            ReferenceGuid: "",
                            SysFilePath: "",
                            Base64File: oFile.fileBase64
                        }
                    });

                    AttachmentData = [...SeekAdvice];

                    oPayload = {
                        AttachmentData
                    };

                    let isValid = (oPayload.AttachmentData.length !== 0);
                    if (isValid) {
                        await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-attachment/DAttachments', oPayload, 'seekAttachResModel');
                        let attachModel = this.getView().getModel('seekAttachResModel').getData();
                        console.log(attachModel);
                        oModel.setData(oData);

                        this.onSaveSeekAdvice();
                    }
                    else {
                        this.onSaveSeekAdvice();
                    }
                    // oData.SeekAdvice.forEach((row) => {
                    //     if (row.Attachment && Array.isArray(row.Attachment)) {
                    //         this._aBase64FilesSeekAdvice = this._aBase64FilesSeekAdvice.concat(row.Attachment.map((file) => ({
                    //             AttachmentGuId: null,
                    //             AttachmentName: file.AttachmentName,
                    //             OrgFileName: file.AttachmentName.split(".")[0],
                    //             OrgFileExtension: file.OrgFileExtension,
                    //             SysFileName: "",
                    //             SysFileExtension: file.OrgFileExtension,
                    //             ReferenceType: "41",
                    //             ReferenceId: null,
                    //             ReferenceGuid: "",
                    //             SysFilePath: "",
                    //             Base64File: file.fileBase64,
                    //         })));
                    //     }
                    // });

                    // // Build the payload
                    // if (this._aBase64FilesSeekAdvice.length > 0) {
                    //     oPayload = { AttachmentData: this._aBase64FilesSeekAdvice };

                    //     try {
                    //         // Send API request
                    //         await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DAttachments", oPayload, "seekAttachResModel");

                    //         // Update the model after a successful API call
                    //         const seekAttachModel = this.getView().getModel("seekAttachResModel");
                    //         const responseData = seekAttachModel.getData();
                    //         console.log("Upload successful:", responseData);

                    //         // Save the SeekAdvice
                    //         this.onSaveSeekAdvice();
                    //     } catch (error) {
                    //         console.error("Error during upload:", error);
                    //     }
                    // } else {
                    //     // No attachments to upload, save the SeekAdvice directly
                    //     this.onSaveSeekAdvice();
                    // }
                }
            },

            onSaveSeekAdvice: async function () {
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.createObjectTarget();

                this.transferObjectValues(srcObject, trgObject);
                trgObject.CadDetailUUID = this.getListViewEditPropertyValue();
                trgObject.SaveOrSubmit = "SeekAdvice";
                trgObject.SeekAdvice.forEach((item) => {
                    item.QuestionFromUser_UserGuid = loginInfo.UserID
                    if (item.Question != null) {
                        item.SendEmailQuestion = "Y"
                        item.SendEmailAnswer = "N"
                    } else if (item.Answer != null) {
                        item.SendEmailQuestion = "N"
                        item.SendEmailAnswer = "Y"
                    } else if (item.Answer != null && item.Question != null) {
                        item.SendEmailQuestion = "Y"
                        item.SendEmailAnswer = "Y"
                    }
                })

                await this.createNewModelUsingAPI("PATCH", "/odata/v4/stoneman-cad/TCadDetail(" + this.getListViewEditPropertyValue() + ")", trgObject, "seekAttachModel");
                const res = this.getApiResponseObject();
                if (res.success) {
                    await this.createNewModelUsingAPI(
                        "GET",
                        '/odata/v4/stoneman-cad/TCadDetail(' + this.getListViewEditPropertyValue() + ')?$expand=SeekAdvice($expand=QuestionToUser,Attachment,Role,QuestionFromUser$filter=DelMark eq 0)',
                        "",
                        "SeekResModel"
                    );
                    const seekResponse = this.getView().getModel("SeekResModel");
                    let seekData = seekResponse.getData();
                    console.log(seekData)
                    await this.onUpdateAttachmentSeekData(seekData.SeekAdvice);
                    MessageToast.show('Seek Advice Save Successfully ');
                    setTimeout(
                        function () {
                            this.router.navTo(this.getBackwardRoute());
                        }.bind(this),
                        1000
                    );
                } else if (res.object.status == 502) {
                    await this.onErrorMessageDialogPress(res.object.responseText);
                }
                else {
                    await this.onErrorMessageDialogPress(res.object.responseJSON.error.details || res.object.responseJSON.error);
                }
            },

            onUpdateAttachmentSeekData: async function (res) {
                const attachmentSeekRes = this.getView().getModel("seekAttachResModel");
                const seekResData = attachmentSeekRes.getData();
                let attachmentData = [];
                let referenceGuid
                // Process each entry in `res`
                res.forEach((resItem) => {
                    referenceGuid = resItem.CADSeekAdviceGuid || "";
                    // Get the CrfAttachmentsGuid
                    if (seekResData.value && seekResData.value.length > 0) {
                        seekResData.value.forEach((valueItem) => {
                            if (valueItem.AttachmentDataResponse) {
                                // Map the attachment data and add it to the result array
                                const mappedData = valueItem.AttachmentDataResponse.map((attachment) => ({
                                    AttachmentGuId: attachment.AttachmentGuId, // Get from AttachmentDataResponse
                                    ReferenceGuid: referenceGuid, // Use the referenceGuid from resItem
                                }));
                                attachmentData = attachmentData.concat(mappedData);
                            }
                            return [];
                        });
                    }
                });
                // Wrap the resulting data into the desired structure
                const finalAttachmentData = { AttachmentData: attachmentData };
                console.log("Optimized Attachment Data:", attachmentData);
                if (attachmentData.length != 0) {
                    await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/UpdateAttachmentData", finalAttachmentData, "updateAttachModel");
                    let updateAttachModel = this.getView().getModel("updateAttachModel");
                    let data = updateAttachModel.getData();
                    console.log(data);
                }

            },
            getChildAssemblyData: async function (product) {
                // Fetch data from OData service
                await this.createNewModelUsingAPI(
                    "GET",
                    `/sap/opu/odata4/sap/zune_sb_bomdetails/srvd_a2x/sap/zune_sd_bomdetails/0001/ZUNE_CDS_InternalBOMAPI?$filter=ParentItemCode eq '${product}'`,
                    "",
                    "CADDetailChildAssembly"
                );

                let CADDetailChildAssembly = this.getView().getModel("CADDetailChildAssembly");
                let datamodel = CADDetailChildAssembly.getData();
                let getEntryFormDataSourceModel = this.getView().getModel(this.getEntryFormDataSourceModelName());

                const apiArray = CADDetailChildAssembly.getProperty("/value") || [];

                // Separate arrays for ChildAssembly and ImportedAccessory
                const childAssemblyData = [];
                const importedAccessoryData = [];

                apiArray.forEach(item => {
                    const mappedItem = {
                        Component: item.ItemCode,
                        ComponentName: item.RMName,
                        DimensionLength: item.L,
                        DimensionWidth: item.W,
                        DimensionHeight: item.H,
                        ComponentUOMName: item.ChildUOM,
                        Type: item.MaterialType,
                        Density: item.Density,
                        PurchasePrice: item.PurchasePrice,
                        ActWastePercent: item.ActualWastagePercentage,
                        OHPrice: item.OHPrice,
                        OHWastePercent: item.OHWastagePercentage,
                        ComponentQuantity: item.Quantity.toFixed(2),
                        IsParent: true,
                        ChildProcess: [],
                        SurfaceArea: null
                    };
                    if (mappedItem.ComponentUOMName = "FT2") {
                        mappedItem.ComponentISOUOMCode = "SFT"
                    } else if (mappedItem.ComponentUOMName = "FT3") {
                        mappedItem.ComponentISOUOMCode = "CFT"
                    }

                    // Check condition for Imported Accessory
                    if (item.MaterialType === "ZRMA" && item.MaterialGroup2 === "2") {
                        importedAccessoryData.push({
                            ItemCode: item.ItemCode,
                            ItemName: item.RMName,
                            Qty: item.Quantity,
                            UnitCost: item.ImportedAccessoryCost,
                            UOMCode: item.ChildUOM,
                            Cost: item.Quantity * item.ImportedAccessoryCost,
                        });
                    } else {
                        childAssemblyData.push(mappedItem);
                    }
                });

                // Set data into respective model properties
                getEntryFormDataSourceModel.setProperty("/MainAssembly/0/ChildAssembly", childAssemblyData);
                getEntryFormDataSourceModel.setProperty("/ImportedAccessory", importedAccessoryData);

            }
            ,

            openTeamDialog: async function () {
                let oView = this.getView();
                let oDialog = this._oTeamDialog;

                if (!oDialog) {
                    oDialog = new sap.m.Dialog({
                        title: "Select Team Member",
                        contentWidth: "800px",
                        contentHeight: "500px",
                        resizable: true,
                        draggable: true,
                        content: [
                            new sap.m.Table({
                                id: oView.createId("teamTable"),
                                mode: "None", // 🔹 no radio button
                                columns: [
                                    new sap.m.Column({
                                        header: new sap.m.Label({ text: "User Name" })
                                    }),
                                    new sap.m.Column({
                                        header: new sap.m.Label({ text: "Role Code" })
                                    })
                                ],
                                items: {
                                    path: "teamModel>/",
                                    template: new sap.m.ColumnListItem({
                                        type: "Active", // 🔹 makes row clickable
                                        press: function (oEvent) {
                                            let oCtx = oEvent.getSource().getBindingContext("teamModel");
                                            let oData = oCtx.getObject();

                                            // save selected row into model
                                            let oCadModel = oView.getModel("EntryFormDataSourceModel")
                                            let oCadData = oCadModel.getData()
                                            oCadData.Team = oCadData.Team.filter(function (member) {
                                                return member.RoleCode !== "DTP_ASSISTANT";
                                            });
                                            console.log("===============Entery from====>", oCadData)
                                            console.log("===============User====>", oData)

                                            let oNewTeamMember = {
                                                // CADTeamGuid: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                                                DelMark: 0,
                                                Parent_CadDetailUUID: oCadData.CadDetailUUID,
                                                ProductCatGuid_ProductCategoryGuid: oCadData.ProductCatGuid_ProductCategoryGuid,
                                                // ProductCategoryCode: oCadData.CategoryCode || "",
                                                ProductCategoryName: oCadData.ProductCatName || "",
                                                RoleCode: oData.UserRoleCode,
                                                RoleGuid_RoleGuid: oData.Role_RoleGuid,
                                                RoleName: "DTP Assistant",
                                                RowNumber: oCadData.Team.length + 1,
                                                UserMaterialCategoryCode: oCadData.MCatCode,
                                                UserMaterialCategoryName: oCadData.MCatName,
                                                UserName: oData.UserName,
                                                User_UserGuid: oData.UserGuid
                                            };

                                            // push new user as DTP_ASSISTANT
                                            oCadData.Team.push(oNewTeamMember);

                                            // refresh model to update UI
                                            oCadModel.refresh(true);

                                            let oSelectedModel = new sap.ui.model.json.JSONModel(oData);
                                            oView.setModel(oSelectedModel, "selectedUserModel");

                                            sap.m.MessageToast.show("Selected: " + oData.UserName);

                                            // close after selection
                                            oDialog.close();
                                        },
                                        cells: [
                                            new sap.m.Text({ text: "{teamModel>UserName}" }),
                                            new sap.m.Text({ text: "{teamModel>UserRoleCode}" })
                                        ]
                                    })
                                }
                            })
                        ],
                        buttons: [
                            new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            })
                        ]
                    });
                    oView.addDependent(oDialog);
                    this._oTeamDialog = oDialog;
                }

                try {
                    let response = await fetch("/odata/v4/stoneman-crf/MUser?$filter=UserRoleCode eq 'DTP_ASSISTANT'");
                    if (!response.ok) {
                        throw new Error("Failed to fetch team members");
                    }

                    let result = await response.json();

                    // set table model
                    let oModel = new sap.ui.model.json.JSONModel(result.value || []);
                    oView.setModel(oModel, "teamModel");

                    oDialog.open();
                } catch (err) {
                    sap.m.MessageToast.show("Error loading team members: " + err.message);
                }
            },




            openTeamDialog1: async function () {
                this.setCflTitle("Select DTP Assistant");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MUser?$filter=UserRoleCode eq 'DTP_ASSISTANT'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["UserName", "UserRoleCode"]);
                this.setCflDataColumns(["UserName", "UserRoleCode"]);
                this.setCflValueAndDisplay("", "", "UserName", "UserRoleCode");
                this.setCflSearchProperty("UserName");
                this.showCfl("CAD_selectUserBtn", this.getCflListViewDataSourceModelName(), "value", this.onOpenTeamDialog.bind(this));
            },
            onOpenTeamDialog: function () {
                let object = this.getCflObject();
                console.log("Selected = > ", object);
                // let model = this.getView().getModel(this.getEntryFormDataSourceModelName());

                // model.setProperty("/CrfReqGuid", object.CrfReqGuid);
                // model.setProperty("/CrfReqUUID_CrfReqGuid", object.CrfReqGuid);
                // this.onChangeCADReqNo();
            },
            onSelect: function (oEvent) {
                var iIndex = oEvent.getParameter("selectedIndex");
                var iValue = (iIndex === 0) ? 1 : 0;
                var oModel = this.getView().getModel("EntryFormDataSourceModel");
                oModel.setProperty("/isPattern", iValue);
            },
            onPackagingSelect: function (oEvent) {
                var iIndex = oEvent.getParameter("selectedIndex");
                var sValue = (iIndex === 0) ? "SKD" : "Assembled";
                this.getView().getModel("EntryFormDataSourceModel").setProperty("/PackagingType", sValue);
            },


            onDeleteChildRow: function (oEvent) {
                const sModelName = this.getEntryFormDataSourceModelName();
                const oModel = this.getView().getModel(sModelName);
                const oContext = oEvent.getSource().getBindingContext(sModelName);

                if (!oContext) {
                    console.error("No binding context found for child process row");
                    return;
                }

                const sPath = oContext.getPath();
                // e.g. /MainAssembly/0/ChildAssembly/0/ChildProcess/1
                const aPathParts = sPath.split("/");
                const sParentArrayPath = sPath.substring(0, sPath.lastIndexOf("/"));
                const sParentLevel = aPathParts[aPathParts.length - 2]; // e.g. "ChildProcess"

                const aParentArray = oModel.getProperty(sParentArrayPath.substring(0, sParentArrayPath.lastIndexOf("/")));
                const aArray = oModel.getProperty(sParentArrayPath);

                const iIndex = parseInt(aPathParts[aPathParts.length - 1], 10);
                if (isNaN(iIndex)) {
                    console.error("Invalid index extracted from path:", sPath);
                    return;
                }

                // Determine array containing this row (could be ChildProcess or Detail)
                const aTargetArray = oModel.getProperty(sParentArrayPath);
                if (!Array.isArray(aTargetArray)) {
                    console.error("No array found at path:", sParentArrayPath);
                    return;
                }

                // Remove selected item
                const oDeleted = aTargetArray.splice(iIndex, 1)[0];

                // Recursively clean up any child data
                this._deleteNestedChildren(oDeleted);

                // Write back array to model
                oModel.setProperty(sParentArrayPath, aTargetArray);
                oModel.refresh(true);
            },

            _deleteNestedChildren: function (oNode) {
                if (!oNode) return;

                if (Array.isArray(oNode.ChildProcess) && oNode.ChildProcess.length > 0) {
                    oNode.ChildProcess.forEach(child => this._deleteNestedChildren(child));
                    oNode.ChildProcess = [];
                }

                if (Array.isArray(oNode.Detail) && oNode.Detail.length > 0) {
                    oNode.Detail = [];
                }
            },
            onAddMainAssemblyRow: function () {
                const oModel = this.getView().getModel("EntryFormDataSourceModel");
                const aData = oModel.getProperty("/MainAssembly") || [];

                // Generate a unique ID
                const sUUID = crypto.randomUUID ? crypto.randomUUID() : this._generateUUID();

                // Create a new blank row
                const oNewRow = {

                    ProductNo: "",
                    ProductName: ""

                };

                // Push new row and refresh the model
                aData.push(oNewRow);
                oModel.setProperty("/MainAssembly", aData);
            },
            onDimensionChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const oContext = oInput.getBindingContext("EntryFormDataSourceModel");
                const oModel = oContext.getModel();

                // Get current values safely as floats
                let length = parseFloat(oModel.getProperty(oContext.getPath() + "/DimensionLength")) || 0;
                let width = parseFloat(oModel.getProperty(oContext.getPath() + "/DimensionWidth")) || 0;
                let height = parseFloat(oModel.getProperty(oContext.getPath() + "/DimensionHeight")) || 0;
                let density = parseFloat(oModel.getProperty(oContext.getPath() + "/Density")) || 1; // default 1 if missing

                // Round input values to 2 decimals
                length = parseFloat(length.toFixed(2));
                width = parseFloat(width.toFixed(2));
                height = parseFloat(height.toFixed(2));
                density = parseFloat(density.toFixed(2));

                // Write rounded values back (prevents floating precision drift)
                oModel.setProperty(oContext.getPath() + "/DimensionLength", length);
                oModel.setProperty(oContext.getPath() + "/DimensionWidth", width);
                oModel.setProperty(oContext.getPath() + "/DimensionHeight", height);

                // Compute weight = (L * W * H) / 1728 * Density
                const weight = ((length * width * height) / 1728) * density;

                // Round to 2 decimals and set numeric value only (no commas!)
                const roundedWeight = parseFloat(weight.toFixed(2));

                // Update model
                oModel.setProperty(oContext.getPath() + "/ChildPartWeight", roundedWeight);

                // No need for oModel.refresh(); binding updates automatically
            },

            onToggleAllChildProcesses: function (oEvent) {
                var oButton = oEvent.getSource();
                var oTable = this.byId("caddetail_childAssemblyTree");
                var oBinding = oTable.getBinding("rows");

                if (!oTable || !oBinding) return;

                var bIsCurrentlyExpanded = oButton.data("expanded") === "true";

                if (bIsCurrentlyExpanded) {
                    // 🔽 Collapse All
                    oTable.collapseAll();
                    oButton.setText("Expand Child Rows");
                    oButton.setIcon("sap-icon://expand-group");
                    oButton.data("expanded", "false");
                } else {
                    // 🔼 Expand All
                    this._expandAllVisible(oTable, oBinding);
                    oButton.setText("Collapse Child Rows");
                    oButton.setIcon("sap-icon://collapse-group");
                    oButton.data("expanded", "true");

                }
            },

            _expandAllVisible: function (oTable, oBinding) {
                var iLength = oBinding.getLength();
                var aContexts = oBinding.getContexts(0, iLength);
                var bExpandedAny = false;

                aContexts.forEach(function (oCtx, index) {
                    if (!oCtx) return;

                    var oNode = oCtx.getObject();

                    // Expand rows that have ChildProcess and are not expanded yet
                    if (oNode.ChildProcess && oNode.ChildProcess.length > 0 && !oTable.isExpanded(index)) {
                        oTable.expand(index);
                        bExpandedAny = true;
                    }
                });

                // Recurse to catch newly revealed rows
                if (bExpandedAny) {
                    setTimeout(function () {
                        this._expandAllVisible(oTable, oBinding);
                    }.bind(this), 50);
                }
            },

            // onExpandAllChildProcesses: function () {
            //     var oTable = this.byId("caddetail_childAssemblyTree");
            //     var oBinding = oTable.getBinding("rows");

            //     if (!oBinding) return;

            //     this._expandAllVisible(oTable, oBinding);
            // },

            // _expandAllVisible: function (oTable, oBinding) {
            //     var iLength = oBinding.getLength();
            //     var aContexts = oBinding.getContexts(0, iLength);

            //     var bExpandedAny = false;

            //     aContexts.forEach(function (oCtx, index) {
            //         if (!oCtx) return;

            //         var oNode = oCtx.getObject();

            //         // Expand rows that have ChildProcess and are not expanded yet
            //         if (oNode.ChildProcess && oNode.ChildProcess.length > 0 && !oTable.isExpanded(index)) {
            //             oTable.expand(index);
            //             bExpandedAny = true;
            //         }
            //     });

            //     // If any row was expanded, newly revealed rows may exist -> recurse
            //     if (bExpandedAny) {
            //         setTimeout(function () {
            //             this._expandAllVisible(oTable, oBinding);
            //         }.bind(this), 50); // small delay allows TreeTable to update
            //     }
            // },
            // onCollapseAllChildProcesses: function () {
            //     var oTable = this.byId("caddetail_childAssemblyTree");
            //     if (oTable) {
            //         oTable.collapseAll();
            //         sap.m.MessageToast.show("All rows collapsed.");
            //     }
            // },
            validateAssemblies: function (oData) {
                if (oData.CadStatus === "AutoDraft") {
                    return true; // Skip validation for AutoDraft
                }

                // --- 1. Validate Main Assembly ---
                if (!oData.MainAssembly || oData.MainAssembly.length === 0) {
                    sap.m.MessageToast.show("Please add at least one Main Assembly line before saving.");
                    return false;
                }

                var aValidMainAssemblies = oData.MainAssembly.filter(function (main) {
                    return main.ProductNo || main.ProductName || main.Quantity || main.Remarks;
                });

                if (aValidMainAssemblies.length === 0) {
                    sap.m.MessageToast.show("Please enter valid Main Assembly details before saving.");
                    return false;
                }

                //#region This Code is comment by Akash as per discuss by Turpti Ma'am
                // if (!oData.Assembly || oData.Assembly.length === 0) {
                //     sap.m.MessageToast.show("Please add at least one Assembly line before saving.");
                //     return false;
                // }

                // var aValidAssembly = oData.Assembly.filter(function (asm) {
                //     return asm.ItemCode || asm.ItemName;
                // });

                // if (aValidAssembly.length === 0) {
                //     sap.m.MessageToast.show("Please enter at least one valid Assembly item.");
                //     return false;
                // }
                //#endregion

                // --- 2. Validate Child Assembly & Processes ---
                var bInvalidData = aValidMainAssemblies.some(function (main) {
                    if (!main.ChildAssembly || main.ChildAssembly.length === 0) {
                        return true;
                    }

                    return main.ChildAssembly.some(function (child) {

                        if (child.Type === "ZRMA" || child.Type === "ZRMP") {
                            return false;
                        }
                        if (!child.ChildProcess || child.ChildProcess.length === 0) {
                            return true;
                        }

                        var bMissingProcessName = child.ChildProcess.some(function (proc) {
                            return !proc.ProcessName || proc.ProcessName.trim() === "";
                        });

                        return bMissingProcessName;
                    });
                });

                if (bInvalidData) {
                    sap.m.MessageToast.show(
                        "Each Child Assembly must have at least one Child Process"
                    );
                    return false;
                }

                // --- 3. Validate required fields in Child Assembly ---
                var isChildValid = true;
                aValidMainAssemblies.forEach(function (main) {
                    if (main.ChildAssembly && main.ChildAssembly.length > 0) {
                        main.ChildAssembly.forEach(function (child) {
                            var requiredFields = [
                                // "SurfaceArea"
                                // "RawMaterialName",
                                // "RawMaterialCode"
                            ];

                            // requiredFields.forEach(function (field) {
                            //     if (!child[field]) {
                            //         sap.m.MessageToast.show(
                            //             "Please fill all mandatory fields in child assembly before saving."
                            //         );
                            //         isChildValid = false;
                            //     }
                            // });
                        });
                    }
                });

                return isChildValid;
            },
            formatAddProcessVisible: function (oContext) {
                if (!oContext) return false;

                const data = oContext.getObject ? oContext.getObject() : oContext;
                return data.IsParent && data.Type !== "ZRMA" && data.Type !== "ZRMP";
            },
            onErrorMessageDialogPress: function (details) {
                // Normalize input → always an array
                let errors = [];

                if (Array.isArray(details)) {
                    errors = details;
                } else if (details && Array.isArray(details.errors)) {
                    errors = details.errors;
                } else if (details && Array.isArray(details.error)) {
                    errors = details.error;
                } else {
                    errors = [details];
                }

                // Build pure "code: message" lines
                const lines = errors.map(err => {
                    //const code = err?.code || "";
                    const msg = err?.message || "";

                    // Extract first and last segment from target
                    let fieldInfo = "";
                    if (err?.target) {
                        const parts = err.target.split("/");
                        const first = parts[0];                         // Stone(...)
                        const last = parts[parts.length - 1];           // Percentage

                        // Clean first segment to remove parentheses
                        const cleanFirst = first.split("(")[0];         // Stone
                        const cleanLast = last.split("(")[0];           // Percentage

                        fieldInfo = ` (Field: ${cleanFirst} → ${cleanLast})`;
                    }

                    return `${msg}${fieldInfo}`;
                });

                // Convert lines into a single string for display
                const finalText = lines.join("\n");

                // Create dialog once
                if (!this.oErrorMessageDialog) {
                    this.oErrorMessageDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        title: "Error",
                        state: sap.ui.core.ValueState.Error,
                        content: new sap.m.Text({ text: "" }),
                        beginButton: new sap.m.Button({
                            text: "OK",
                            press: function () {
                                this.oErrorMessageDialog.close();
                            }.bind(this)
                        })
                    });
                }

                // Update dialog text
                const oText = this.oErrorMessageDialog.getContent()[0];
                if (oText?.setText) {
                    oText.setText(finalText);
                }

                this.oErrorMessageDialog.open();
            },



            cflForName: async function (oEvent) {
                var oSource = oEvent.getSource();
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split("/");
                this.iMainIndex = rowIndex[2]

                this.setCflTitle('Code List');
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/MCodeName`,
                    "",
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Code', 'Name']);
                this.setCflDataColumns(['Code', 'Name']);
                this.setCflValueAndDisplay('', '', '', '', '');
                this.setCflSearchProperty('Name');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", `/odata/v4/stoneman-crf/MCodeName`, "", "value");

                this.showCfl('caddetail_ItemName', this.getCflListViewDataSourceModelName(), 'value', this.onConfirmforName.bind(this), this.onClosecflForcflForRole.bind(this));
            },
            onConfirmforName: async function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());

                y.setProperty(`/Assembly/${this.iMainIndex}/ItemName`, x.Name);
                y.setProperty(`/Assembly/${this.iMainIndex}/ItemCode`, x.Code);

            },

            onClosecflForcflForRole: function () {
                let x = this.getCflObject();
            },
            onAddAssemblyRow: function () {
                const oModel = this.getView().getModel("EntryFormDataSourceModel");
                const aData = oModel.getProperty("/Assembly") || [];

                // Generate a unique ID
                const sUUID = crypto.randomUUID ? crypto.randomUUID() : this._generateUUID();

                // Create a new blank row
                const oNewRow = {

                    ItemName: "",
                    ItemCode: ""

                };

                // Push new row and refresh the model
                aData.push(oNewRow);
                oModel.setProperty("/Assembly", aData);
            },

            onDeleteAssemblyRow: function (oEvent) {
                var oTable = this.byId("caddetail_AssemblyTable");
                var oItem = oEvent.getSource().getParent(); // get the clicked row
                var oCtx = oItem.getBindingContext("EntryFormDataSourceModel");
                var sPath = oCtx.getPath();
                var oModel = oCtx.getModel();

                // Remove the item from the model
                var aData = oModel.getProperty("/Assembly");
                var iIndex = parseInt(sPath.split("/").pop());
                aData.splice(iIndex, 1);
                oModel.setProperty("/Assembly", aData);
            },

            // calculateFormulaData: function (length, width, height, density, uom) {
            //     length = parseFloat(length) || 0;
            //     width = parseFloat(width) || 0;
            //     height = parseFloat(height) || 0;
            //     density = parseFloat(density) || 1;
            //     uom = (uom || "").toUpperCase();

            //     // Initialize results
            //     let rmQty = 0;
            //     let weight = 0;

            //     // Calculate RM Quantity based on UOM
            //     if (uom === "SFT") {
            //         rmQty = (length * width / 144);
            //         weight = (length * width / 144) * density;

            //     } else if (uom === "CFT") {
            //         rmQty = (length * width * height / 1728);
            //         weight = (length * width * height / 1728) * density;

            //     }


            //     return {
            //         rmQuantity: rmQty ? rmQty.toFixed(2) : "0.00",
            //         weight: weight.toFixed(2)
            //     };
            // },
            onDimensionOrModelChange: function (oEventOrModel) {
                let oModel;

                // Case 1: Triggered from liveChange (user input)
                if (oEventOrModel?.getSource) {
                    const oInput = oEventOrModel.getSource();
                    const oContext = oInput.getBindingContext("EntryFormDataSourceModel");
                    if (!oContext) return;

                    oModel = oContext.getModel();
                    const oData = oContext.getObject();

                    if (oData.IsParent === true || oData.IsParent === "true") {
                        const materialData = this._calculateFormula(
                            oData.DimensionLength,
                            oData.DimensionWidth,
                            oData.DimensionHeight,
                            oData.Density,
                            oData.ComponentUOMName
                        );

                        oData.RMQuantity = materialData.rmQuantity;
                        oData.ChildPartWeight = materialData.weight;
                        oModel.refresh(true);
                    }

                    return; // Done for single-row case
                }

                // Case 2: Triggered manually (e.g. when model loads)
                if (oEventOrModel instanceof sap.ui.model.json.JSONModel) {
                    oModel = oEventOrModel;
                } else {
                    // fallback: get from view
                    oModel = this.getView().getModel("EntryFormDataSourceModel");
                }

                if (!oModel) return;
                const oData = oModel.getData();

                if (oData.MainAssembly && oData.MainAssembly.length > 0) {
                    oData.MainAssembly.forEach(main => {
                        if (main.ChildAssembly && main.ChildAssembly.length > 0) {
                            main.ChildAssembly.forEach(child => {
                                if (child.IsParent === true || child.IsParent === "true") {
                                    const materialData = this._calculateFormula(
                                        child.DimensionLength,
                                        child.DimensionWidth,
                                        child.DimensionHeight,
                                        child.Density,
                                        child.ComponentUOMName
                                    );

                                    child.RMQuantity = materialData.rmQuantity;
                                    child.ChildPartWeight = materialData.weight;
                                }


                            });
                        }
                    });
                }

                oModel.refresh(true);
            },
            _calculateFormula: function (length, width, height, density, uom) {
                // Safely parse all numeric inputs
                const l = parseFloat(length) || 0;
                const w = parseFloat(width) || 0;
                const h = parseFloat(height) || 0;
                const d = parseFloat(density) || 1;
                const unit = (uom || "").toUpperCase();

                let rmQty = 0;
                let weight = 0;

                // --- Calculation logic only for defined UOMs ---
                if (unit === "FT2") {
                    // Square Feet — typically for sheet or plate materials
                    rmQty = (l * w) / 144; // inch² → ft²
                    weight = rmQty * d;
                }
                else if (unit === "FT3") {
                    // Cubic Feet — typically for solid / volumetric materials
                    rmQty = (l * w * h) / 1728; // inch³ → ft³
                    weight = rmQty * d;
                }

                // Return results (no default logic)
                return {
                    rmQuantity: rmQty.toFixed(2),
                    weight: weight.toFixed(2)
                };
            },


            onFailedSetDateFromatToDisplay: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                oData.UserAssign.forEach(function (item, index = 0) {
                    item.MeetingStartDate =
                        item.MeetingStartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingStartDate);
                    item.MeetingEndDate =
                        item.MeetingEndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingEndDate);
                });
            },
            enableDisableViewBtn: function (data) {
                console.log(data);
                let validExtensions = ['xls', 'xlsx', 'ppt', 'pptx', 'doc', 'docx', 'eml', 'msg', 'txt', 'stl', 'STL', 'dxf', 'plt', 'hpgl', 'cdr', 'IGS', 'dwg', 'stp'];
                let oView = this.getView();

                // Helper function to check if a filename has a valid extension
                const hasValidFileExtension = (fileName) =>
                    validExtensions.some((ext) => fileName && fileName.toLowerCase().endsWith(ext));

                // Disable specific buttons for InspDraw table rows based on file extensions
                let oTableInspDraw = oView.byId('cadTable'); // Update this ID to match your table ID
                if (oTableInspDraw) {
                    let aItems = oTableInspDraw.getItems(); // Get the rows of the table
                    aItems.forEach((oItem, index) => {
                        let oData = data.InspDraw[index];
                        if (oData && hasValidFileExtension(oData.AttachFileName)) {
                            // Find the HBox within the row, then find the viewBtn within the HBox
                            let oHBox = oItem.getCells().find(cell => cell.getId().includes("hBoxInspView"));
                            if (oHBox) {
                                let oViewBtn = oHBox.getItems().find(item => item.getId().includes("viewBtn"));
                                if (oViewBtn) {
                                    oViewBtn.setEnabled(false);
                                }
                            }
                        }
                        if (oData && hasValidFileExtension(oData.DraftRemarks)) {
                            // Find the HBox within the row, then find the viewBtn within the HBox
                            let oHBox = oItem.getCells().find(cell => cell.getId().includes("hBoxProdView"));
                            if (oHBox) {
                                let oViewBtn = oHBox.getItems().find(item => item.getId().includes("viewBtnProd"));
                                if (oViewBtn) {
                                    oViewBtn.setEnabled(false);
                                }
                            }
                        }
                        if (oData && hasValidFileExtension(oData.TechRemarks)) {
                            // Find the HBox within the row, then find the viewBtn within the HBox
                            let oHBox = oItem.getCells().find(cell => cell.getId().includes("hBoxTechView"));
                            if (oHBox) {
                                let oViewBtn = oHBox.getItems().find(item => item.getId().includes("viewBtnTech"));
                                if (oViewBtn) {
                                    oViewBtn.setEnabled(false);
                                }
                            }
                        }
                    });
                }

                // Disable specific buttons for SeekAdvice table rows based on file extensions
                let oTableSeekAdvice = oView.byId('seekAdviceTable'); // Update this ID to match your table ID
                if (oTableSeekAdvice) {
                    let aItems = oTableSeekAdvice.getItems(); // Get the rows of the table
                    aItems.forEach((oItem, index) => {
                        let oData = data.SeekAdvice[index];
                        if (oData.SeekAdviceDocAbsId != null) {
                            if (oData && hasValidFileExtension(oData.SeekAdviceDocAbsId.DisplayName)) {
                                // Find the HBox within the row, then find the viewBtn within the HBox
                                let oHBox = oItem.getCells().find(cell => cell.getId().includes("hBoxSeekView"));
                                if (oHBox) {
                                    let oViewBtn = oHBox.getItems().find(item => item.getId().includes("seekAttachBtn"));
                                    if (oViewBtn) {
                                        oViewBtn.setEnabled(false);
                                    }
                                }
                            }
                        }

                    });
                }

                if (data.PDCAttachmentAbsId && hasValidFileExtension(data.PDCAttachmentAbsId.DisplayName)) {
                    // Find the outer HBox (with the user_upload_padd class)
                    let oOuterHBox = oView.byId('pddrraId').getParent(); // Get the parent HBox of pddrrView
                    if (oOuterHBox) {
                        let oInnerHBox = oOuterHBox.getItems().find(item => item.hasStyleClass('align-text'));
                        if (oInnerHBox) {
                            let oPDDRAButton = oInnerHBox.getItems().find(item => item.getId().includes('pddrrView'));
                            if (oPDDRAButton) {
                                oPDDRAButton.setEnabled(false);
                            }
                        }
                    } else {
                        console.warn('HBox (hBoxPDDRAView) not found within oOuterHBox');
                    }
                }


            },
            DeleteAttachmentFromDMS_Old: async function () {
                let filesPayload = this.getView().getModel("filesPayload");
                if (filesPayload?.Files.length > 0) {
                    await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DeleteAttachmentFromDMS", filesPayload, "DeleteAttachModel");
                }
                this.getView().setModel(
                    new sap.ui.model.json.JSONModel({ Files: [] }),
                    "filesPayload"
                );
            },
            DeleteAttachmentFromDMS: async function () {
                // let filesPayload = this.getView().getModel("filesPayload")?.getData() || {};
                let oModel = this.getView().getModel("filesPayload");

                // Safely extract data
                // let filesPayload = oModel ? oModel.getProperty("/") : {};
                if (oModel) {

                    // Ensure Files exists and is an array
                    let validFiles = Array.isArray(oModel.Files)
                        ? oModel.Files.filter(f => f && Object.keys(f).length > 0)
                        : [];

                    // Build a safe payload
                    let safePayload = { Files: validFiles };

                    // Only call API if at least 1 valid file exists
                    if (safePayload.Files.length > 0) {
                        await this.createNewModelUsingAPI(
                            "POST",
                            "/odata/v4/stoneman-attachment/DeleteAttachmentFromDMS",
                            safePayload,
                            "DeleteAttachModel"
                        );
                    }
                }

                // Reset model
                this.getView().setModel(
                    new sap.ui.model.json.JSONModel({ Files: [] }),
                    "filesPayload"
                );
            },
            onDeleteAttachment: async function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                let MasterData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData()
                let data = MasterData.InspDraw[iIndex].Attachment
                let filesPayload = {
                    Files: data
                        .filter(item => item.AttachmentGuId != null && item.AttachmentGuId !== '')
                        .map(item => ({
                            AttachmentGuId: item.AttachmentGuId
                        }))
                };
                let datafordelete = this.getView().getModel("filesPayload");
                if (datafordelete?.Files) {
                    datafordelete.Files.push(...filesPayload.Files);
                } else {
                    datafordelete = filesPayload
                }
                this.getView().setModel(datafordelete, "filesPayload")
                // this.getView().setModel(filesPayload,"filesPayload")
                await this.deleteRow(this.getEntryFormDataSourceModelName(), 'InspDraw', iIndex);
                // if (filesPayload.Files.length>0) {
                //     await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DeleteAttachmentFromDMS", filesPayload, "viewAttachModel");
                // }
            },

            onSurfaceAreaChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const sValue = oInput.getValue();

                // If user clears the field → force numeric 0
                if (sValue === "" || sValue === null) {
                    oInput.getBinding("value").setValue(0);
                }
            },
            onMainFileChange: function (oEvent) {

                const oFileUploader = oEvent.getSource();
                const aFiles = oEvent.getParameter("files");

                if (!aFiles || !aFiles.length) {
                    sap.m.MessageToast.show("No file selected");
                    return;
                }

                const file = aFiles[0];

                // Validate file type
                const sExtension = file.name.split('.').pop().toLowerCase();
                if (FileTypesConfig.allowedFileTypes.indexOf(sExtension) === -1) {
                    sap.m.MessageToast.show("Invalid file type");
                    oFileUploader.setValue("");
                    return;
                }

                // Get Main Model
                // const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // var sPath = "/MainAttachment/Attachment";

                //oMainModel.setProperty(sPath + "/OrgFileName", file.name);
                let oModel = this.getView().getModel("AttachModel");
                this._aBase64FileSingle = oModel.getProperty("/Attachments") || [];
                let that = this;

                // Read file as Base64
                this._readFileAsBase64Single(file, function (base64) {
                    // Create attachment object
                    if (!that._aBase64FileSingle) {
                        that._aBase64FileSingle = [];
                    }

                    if (!that._aBase64FileSingle[0]) {
                        that._aBase64FileSingle[0] = {};
                    }

                    that._aBase64FileSingle[0].AttachmentName = file.name;
                    that._aBase64FileSingle[0].OrgFileExtension = file.name.split('.').pop();
                    that._aBase64FileSingle[0].fileBase64 = base64;
                    // Create attachment object

                    // that._aBase64FileSingle[0].AttachmentName = file.name,
                    //     that._aBase64FileSingle[0].OrgFileExtension = file.name.split('.').pop(),
                    //     that._aBase64FileSingle[0].fileBase64 = base64, // Base64 encoded string

                    oModel.setProperty("/Attachments", that._aBase64FileSingle);
                    oModel.refresh(true);



                })

            },
            _readFileAsBase64Single: function (file, callback) {

                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64String = event.target.result.split(",")[1]; // Get Base64 part of the string
                    callback(base64String);
                };
                reader.onerror = function (error) {
                    console.error("Error reading file as Base64:", error);
                    sap.m.MessageToast.show("Error reading file: " + file.name);
                };
                reader.readAsDataURL(file); // Read file as Data URL

            },
            onUpdateImageData: async function (res) {
                //temporary comment DMS - Trupti 28102025
                // return;

                const attachImageResModel = this.getView().getModel("attachResModel");
                if (attachImageResModel !== undefined) {
                    const attachImgResData = attachImageResModel.getData();
                    let attachmentData = [];
                    let referenceGuid;
                    // Since res is now an object, not array
                    if (res) {

                        referenceGuid = res.MainAttachmentGuid || res.Attachment?.ReferenceGuid || "";

                        // Get the attachment data from attachImgResData
                        // if (attachImgResData && attachImgResData.value.length > 0) {

                        //     const mappedData = [{
                        //         AttachmentGuId: attachImgResData.value[0].AttachmentDataResponse[0].AttachmentGuId,
                        //         ReferenceGuid: referenceGuid
                        //     }];

                        //     attachmentData = attachmentData.concat(mappedData);

                        // }
                        if (attachImgResData && attachImgResData.value && attachImgResData.value.length > 0) {

                            const attachmentResponses = attachImgResData.value[0].AttachmentDataResponse;

                            if (attachmentResponses && attachmentResponses.length > 0) {

                                // Find where ReferenceType = "21"
                                const targetAttachment = attachmentResponses.find(
                                    item => item.ReferenceType === "21"
                                );

                                if (targetAttachment) {

                                    const mappedData = [{
                                        AttachmentGuId: targetAttachment.AttachmentGuId,
                                        ReferenceGuid: referenceGuid
                                    }];

                                    attachmentData = attachmentData.concat(mappedData);

                                }
                            }
                        }


                    }
                    // Wrap the resulting data into the desired structure
                    const finalAttachmentData = { AttachmentData: attachmentData };
                    console.log("Optimized Attachment Data:", attachmentData);
                    if (attachmentData.length != 0) {
                        await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/UpdateAttachmentData", finalAttachmentData, "updateAttachModel");
                        let updateAttachModel = this.getView().getModel("updateAttachModel");
                        let data = updateAttachModel.getData();
                        console.log(data);
                    }
                    await this.clearAttachmentFragmentData();
                }
            },
            onDeleteMainAttachment: async function (oEvent) {
                //var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                let MasterData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData()
                let mainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());

                let data = MasterData.MainAttachment.Attachment

                let filesPayload = {
                    Files: data.AttachmentGuId
                        ? [{
                            AttachmentGuId: data.AttachmentGuId
                        }]
                        : []
                };
                let datafordelete = this.getView().getModel("filesPayload");
                if (datafordelete?.Files) {
                    datafordelete.Files.push(...filesPayload.Files);
                } else {
                    datafordelete = filesPayload
                }
                this.getView().setModel(datafordelete, "filesPayload")
                // await this.deleteSingleAttachment(this.getEntryFormDataSourceModelName(), 'MainAttachment/Attachment');
                let oModelAttachAdd = this.getView().getModel("AttachModel");
                if (oModelAttachAdd) {
                    oModelAttachAdd.setData({});
                    oModelAttachAdd.refresh(true);
                }
                mainModel.setProperty("/MainAttachment/Attachment", {});
                // Remove the file at the index
                oModel.setProperty("/Attachments", data);

            },
            onViewImage: async function (oEvent) {
                await this.onViewFileHandler(oEvent, "/MainAttachment");
            },
            onDownloadImage: async function (oEvent) {
                await this.onDownloadFileHandler(oEvent, "/MainAttachment");
            },
            onDownloadFileHandler: async function (oEvent, modelPath) {

                let oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oDataInspDraw = oMainModel.getProperty(modelPath);
                let oAttachmentArray = oDataInspDraw?.[this.iRowAttachmentIndex]?.Attachment || oDataInspDraw?.Attachment;
                if (!oAttachmentArray || oAttachmentArray.length === 0) {
                    MessageToast.show("No attachments available.");
                    return;
                }

                // Process the selected attachment
                //let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");
                // let oSelectedAttachment = oBindingContext.getObject();
                let oSelectedAttachment = null;

                // Case 1: From binding context (Table/List click)
                let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");

                if (oBindingContext) {
                    oSelectedAttachment = oBindingContext.getObject();
                }

                // Case 2: From root model (single attachment)
                if (!oSelectedAttachment) {
                    oSelectedAttachment = this.getView().getModel(this.getEntryFormDataSourceModelName())?.getProperty("/MainAttachment/Attachment");

                }
                if (!oSelectedAttachment || !oSelectedAttachment.AttachmentGuId) {
                    MessageToast.show("Invalid or missing attachment data.");
                    return;
                }

                // Proceed with the selected attachment
                let payload = {
                    ID: oSelectedAttachment.AttachmentGuId
                };

                // API call to fetch the attachment data
                await this.createNewModelUsingAPI(
                    "POST",
                    "/odata/v4/stoneman-attachment/DGetAttachmentDataWithFile",
                    payload,
                    "downloadAttachModel"
                );

                const res = this.getApiResponseObject();

                if (res.success) {
                    this.downloadAttachmentData(res.object.value);
                } else {
                    MessageToast.show(res.object.responseJSON.error.message || "Failed to retrieve attachment data.");
                }
            },
            downloadAttachmentData: function (downloaData) {
                var sBase64 = downloaData.Base64File;
                var sFileType = downloaData.OrgFileExtension;
                var actualFileName = downloaData.AttachmentName;
                var byteCharacters = atob(sBase64);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                var blob = new Blob([byteArray], { type: sFileType });
                var sBlobUrl = URL.createObjectURL(blob);
                var aLink = document.createElement('a');
                aLink.href = sBlobUrl;
                aLink.download = actualFileName;
                aLink.click();
                MessageToast.show('File downloaded successfully.');
            },

        })

    }
);
