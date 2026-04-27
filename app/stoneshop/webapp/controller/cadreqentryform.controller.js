sap.ui.define(
    [
        'core/generic/genericentryform',
        './SeekAdviceCommentDialog.controller',
        'sap/ui/core/format/DateFormat',
        'sap/m/MessageToast',
        'sap/ui/model/json/JSONModel',
        './ApproveRejectFragment.controller',
        'sap/m/Dialog',
        'sap/m/Image',
        'sap/m/PDFViewer',
        'stoneman/modone/model/formatter',
        './timeslotFragment.controller',
        'stoneman/modone/constants/Constant'
    ],
    function (
        genericentryform,
        SeekAdviceCommentDialog,
        DateFormat,
        MessageToast,
        JSONModel,
        ApproveRejectFragment,
        Dialog,
        Image,
        PDFViewer,
        formatter,
        timeslotFragment,
        Constant
    ) {
        'use strict';
        let irowIndex;
        let absID = [];
        let absProdEnggID = {};
        let absTechID = {};
        let oSelectDiamension;
        let oSelectDiameter;
        let absIDPDDRAMeeting = null;
        let absIDSeekAdvice = [];
        let _aBase64Files = [];
        let _aBase64FilesPDDRAMeeting = {};
        let _aBase64FilesDesigner = {};
        let _aBase64FilesSeekAdvice = [];
        let _fileData = [];
        let _fileDataAttachment = [];
        let fileName = '';
        let _oSelectedRowContext;
        let _iRowIndex;
        let _oInputField;
        let AttachmentData = [];
        let PDDRAMetting = {};
        let SeekAdvice = [];
        let enableDisableArray = [];
        let enableDisableArrayForBtn = [];
        let buyerCode;
        let sstageCode;
        let RoleInfo;
        let LoginInfo;
        let formMode;
        let aTimeSlots = [];
        let isValidateMaterial = false;
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
                'stp'
            ]
        };
        let saveorsubmit;
        return genericentryform.extend('modonecontroller.cadrequestentryform', {
            constructor: function () {
                this.irowIndex = 0;
            },

            onInit: async function () {
                genericentryform.prototype.onInit.apply(this, arguments);
                //await this.loadFragments(['Header', 'Dimensions', 'Attachment', 'PDDRRAMeeting', 'SeekAdvice', 'Progress']);
                this.getView().getModel(this.getEntryFormDataSourceModelName()).refresh(true);
            },

            onBeforeShow: async function (oEvent) {
                this.identifyFormMode(oEvent);
                this.initialize();
                this.setEntryFormDataSourceURLForEditMode(
                    '/odata/v4/stoneman-crf/TCrfHeader(' +
                    this.getListViewEditPropertyValue() +
                    ')?$expand=TechnoUserId,Material,PDCUserId,QualityTLUserId,QualityATLUserId,DesignerUserId,InspDraw($expand=InspRefDocAbsId,DraftUserID),PDCAttachmentAbsId,MerTeamHead,MerTL,MerATL,UserAssign($expand=UserID),SeekAdvice($expand=UserID,RoleCode,SeekAdviceDocAbsId),ApprovalTransaction($expand=UserId)'
                );
                await this.showEntryForm();
                if (formMode === '2') {
                    await this.getEditData();
                }
            },

            onCheckDiamension: function (oEvent) {
                oSelectDiamension = oEvent.getParameter('selected');
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oViewModel.setProperty('/isDimension', oSelectDiamension);
            },
            onCheckDiameter: function (oEvent) {
                oSelectDiameter = oEvent.getParameter('selected');
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oViewModel.setProperty('/isDiamter', oSelectDiameter);
            },

            initialize: async function () {
                RoleInfo = this.getRoleDetails();
                LoginInfo = this.getLoginInfo();
                formMode = this.getFormMode();
                this.setPageId('cadreqef');
                this.setFormTitle('CAD Entry Form');

                this.setBackwardRoute('RouteCadRequestListView');

                this.setEntryFormDataSourceURLForNewMode('');

                this.setEntryFormDataSourceURLToAddData('/odata/v4/stoneman-crf/TCrfHeader');
                this.setEntryFormDataSourceURLToUpdateData(
                    '/odata/v4/stoneman-crf/TCrfHeader(' + this.getListViewEditPropertyValue() + ')'
                );

                this.setListViewFilterColumn('cadreqlvInpCrfTech', 'Tech', 'Cfl', 'eq', 'String', 'DepartmentName', 'cflForTech');

                let oPathSaveReq = jQuery.sap.getModulePath(
                    'stoneman',
                    '/modone/model/CadRequestSaveRequest.json' //Save Request Model
                );
                let oModelSaveRequest = new sap.ui.model.json.JSONModel(oPathSaveReq);
                this.getView().setModel(oModelSaveRequest, 'CadRequestSaveRequestModel');
                let oPathTimeSlot = jQuery.sap.getModulePath('stoneman', '/modone/model/timeSlot.json');
                let oModelTimeSlot = new sap.ui.model.json.JSONModel(oPathTimeSlot);
                this.getView().setModel(oModelTimeSlot, 'TimeSlotModel');

                let oPathUserAvailability = jQuery.sap.getModulePath('stoneman', '/modone/model/UserAvailability.json');
                let oModelUserAvailable = new sap.ui.model.json.JSONModel(oPathUserAvailability);
                this.getView().setModel(oModelUserAvailable, 'UserAvailableModel');

                let oPathSeekAdvice = jQuery.sap.getModulePath('stoneman', '/modone/model/SeekAdviceSaveRequest.json');
                let oModelSeekAdvice = new sap.ui.model.json.JSONModel(oPathSeekAdvice);
                this.getView().setModel(oModelSeekAdvice, 'SeekAdviceModel');

                this.populateItemGroupDropDown();
                let sampleData = {
                    ReqTypArray: [
                        {
                            id: 'N',
                            name: 'New'
                        },
                        {
                            id: 'R',
                            name: 'Repeat'
                        }
                    ],
                    CRFCATArray: [
                        {
                            id: 'CAD',
                            name: 'CAD'
                        },
                        {
                            id: 'Rendering',
                            name: 'Rendering'
                        }
                    ],

                    lblType: [
                        {
                            id: 'decor',
                            name: 'Decor'
                        },
                        {
                            id: 'furnishing',
                            name: 'Furniture'
                        }
                    ],
                    inputTypeArray: [
                        {
                            id: 'INPUT1',
                            name: 'Internal'
                        },
                        {
                            id: 'INPUT2',
                            name: 'External'
                        }
                    ],

                    callMeeting: [
                        {
                            id: '',
                            name: 'Please Select'
                        },
                        {
                            id: 'Y',
                            name: 'Yes'
                        },
                        {
                            id: 'N',
                            name: 'No'
                        }
                    ],

                    meetingAttanded: [
                        {
                            id: '',
                            name: 'Please Select'
                        },
                        {
                            id: 'Y',
                            name: 'Yes'
                        },
                        {
                            id: 'N',
                            name: 'No'
                        }
                    ]
                };
                this.createNewModelUsingArray('ReqTypeModel', sampleData);

                this.myName = LoginInfo['Username'];
                let oViewModel = new JSONModel({ myName: this.myName });

                this.getView().setModel(oViewModel, 'view');
                this._aBase64Files = [];
                this.AttachmentData = [];
                this.absID = [];
                this.absProdEnggID = [];
                this.absTechID = {};
                this.absIDSeekAdvice = [];
                this._aBase64FilesPDDRAMeeting = {};
                this._aBase64FilesDesigner = {};
                this._aBase64FilesSeekAdvice = [];
                this._fileData = [];
                this._fileDataAttachment = [];
                this._savedQueryValue = '';
                this._oSelectedRowContext = null;

                if (formMode == '3') {
                    let oPath = jQuery.sap.getModulePath(
                        'stoneman',
                        '/modone/model/CadRequestEntryResponse.json' // Edit Response Model
                    );

                    let oModel = new sap.ui.model.json.JSONModel(oPath);
                    this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());

                    await this.getStageFieldApi();
                    await this.addScreenFunctaionality();

                    let oCurrentDate = new Date();
                    let oFormattedDate = formatter.getDateFromatIn_ddMMyyyy(oCurrentDate);
                    this.getView().byId('mercReqDate').setValue(oFormattedDate);
                    // let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    // console.log(oModel.getData());

                }

                if (formMode == '2') {
                    let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    buyerCode = oModel.getProperty('/BuyerCode');
                    await this.editScreenFunctionality();
                }

                let oObjectPageLayout = this.byId('HeaderObject');
                let oSection = this.byId('HeaderSelect');
                oObjectPageLayout.setSelectedSection(oSection);

                //Table Scrolling 
                const aScrollContainerIds = ['scrollDiamension', 'scrollAttachment', 'scrollPDDRA', 'scrollCRFSeekAdvice', 'scrollCRFProgress'];
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

            getEditData: async function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                console.log(oModel);
                let aData = oModel.getData();
                aData.InspDraw.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                    item.isNewRow = false;
                    item.isDownloadVisible = true;
                });
                aData.Material.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                });
                aData.UserAssign.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                });
                aData.SeekAdvice.forEach(function (element) {
                    element.isNewRow = false;
                    element.isDownloadVisibleSeek = true;
                });
                aData.ApprovalTransaction.forEach(function (item, index = 0) {
                    item.processDte = item.ProcessDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.ProcessDate);
                    item.startDte = item.StartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.StartDate);
                    item.endDte = item.EndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.EndDate);
                    item.RowNumber = index + 1;
                });
                aData.UserAssign.forEach(function (item, index = 0) {
                    item.MeetingStartDate =
                        item.MeetingStartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingStartDate);
                    item.MeetingEndDate =
                        item.MeetingEndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingEndDate);
                    item.RowNumber = index + 1;
                });
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD
                ) {
                    if (aData.CrfStageCode_StageCode_StageConstant === 'STG_BUYER_APPROVAL_PENDING') {
                        let oView = this.getView();
                        oView.byId('btnApprove').setVisible(true);
                        oView.byId('btnReject').setVisible(true);
                        oView.byId('btnSave').setVisible(false);
                        oView.byId('btnSubmit').setVisible(false);
                        oView.byId('btnPrint').setVisible(false);
                    }
                }
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG) {
                    let oView = this.getView();
                    oView.byId('attachProd').setVisible(true);
                    oView.byId('prodEnggAttach').setVisible(true);
                    oView.byId('attachTech').setVisible(false);
                    oView.byId('techAttachFile').setVisible(false);
                }
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST) {
                    let oView = this.getView();
                    oView.byId('attachProd').setVisible(false);
                    oView.byId('prodEnggAttach').setVisible(false);
                    oView.byId('attachTech').setVisible(true);
                    oView.byId('techAttachFile').setVisible(true);
                }
                this.byId('meetingDte').setValue(null);
                this.byId('startTime').setValue(null);
                this.byId('endTime').setValue(null);
                this.byId('timeSlotCombo').setValue(null);

                this.getAllExpendData(aData);
                this.showHideViewBtn(aData);
                this.getEnableDisableAPIFun(aData.CrfStageCode_StageCode_StageConstant);
                this.getEnableDisableAPIForApproveRejectBtn();
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                    this.onGenerateTimeSlots();
                }
                await this.enableDisableViewBtn(aData);
                oModel.setData(aData);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
            },

            editScreenFunctionality: async function () {
                absProdEnggID = {};
                absTechID = {};
                absIDSeekAdvice = [];
                absID = [];
                sstageCode = this.getView()
                    .getModel(this.getEntryFormDataSourceModelName())
                    .getProperty('/CrfStageCode_StageCode_StageConstant');
                this.byId('fileUploader').setValue('');
                this.byId('fileUploader1').setValue('');
                this.byId('fileUploader2').setValue('');
                this.byId('techAttachFile').setValue('');
                this.byId('prodEnggAttach').setValue('');
                this.byId('cadTable').getColumns()[3].setVisible(true);
                this.byId('cadTable').getColumns()[4].setVisible(true);
                this.byId('cadTable').getColumns()[5].setVisible(false);
                this.byId('cadTable').getColumns()[10].setVisible(true);
                this.byId('cadTable').getColumns()[8].setVisible(true);
                this.byId('seekAdviceTable').getColumns()[4].setVisible(true);
                this.byId('seekAdviceTable').getColumns()[5].setVisible(true);
                this.byId('pddraAttachInput').setVisible(true);
                //this.byId("seekAdviceTable").getColumns()[6].setVisible(true);
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL
                ) {
                    var oView = this.getView();
                    oView.byId('btnSave').setVisible(false);
                    oView.byId('btnSubmit').setVisible(false);
                    oView.byId('btnPrint').setVisible(false);
                    oView.byId('btnApprove').setVisible(true);
                    oView.byId('btnReject').setVisible(true);
                } else {
                    var oView = this.getView();
                    oView.byId('btnSave').setVisible(true);
                    oView.byId('btnSubmit').setVisible(true);
                    oView.byId('btnPrint').setVisible(true);
                    oView.byId('btnApprove').setVisible(false);
                    oView.byId('btnReject').setVisible(false);
                }
            },

            addScreenFunctaionality: async function () {
                var oView = this.getView();
                sstageCode = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/StageCode_StageConstant');
                this.byId('cadTable').getColumns()[3].setVisible(false);
                this.byId('cadTable').getColumns()[4].setVisible(false);
                this.byId('cadTable').getColumns()[5].setVisible(true);
                this.byId('cadTable').getColumns()[8].setVisible(false);
                this.byId('cadTable').getColumns()[10].setVisible(false);
                this.byId('seekAdviceTable').getColumns()[4].setVisible(false);
                this.byId('seekAdviceTable').getColumns()[5].setVisible(false);
                this.byId('seekAdviceTable').getColumns()[6].setVisible(true);
                oView.byId('btnSave').setVisible(true);
                oView.byId('btnSubmit').setVisible(true);
                oView.byId('btnPrint').setVisible(false);
                oView.byId('btnApprove').setVisible(false);
                oView.byId('btnReject').setVisible(false);
                oView.byId('pddraAttachInput').setVisible(false);
                this.getEnableDisableAPIFun(sstageCode);
                this.readOnlyInputFun();
            },

            showHideViewBtn: function (data) {
                data.SeekAdvice.forEach(function (item) {
                    if (item.SeekAdviceDocAbsId_AbsId !== null) {
                        item.isDownloadVisibleSeek = true;
                    } else {
                        item.isDownloadVisibleSeek = false;
                    }
                });
                data.InspDraw.forEach(function (item) {
                    if (item.DraftAttachmentAbsId_AbsId !== null) {
                        item.isDownloadVisibleDraft = true;
                    } else {
                        item.isDownloadVisibleDraft = false;
                    }
                    if (item.TechAttachementAbsID_AbsId !== null) {
                        item.isDownloadVisibleTech = true;
                    } else {
                        item.isDownloadVisibleTech = false;
                    }
                    if (item.InspRefDocAbsId_AbsId !== null) {
                        item.isDownloadVisible = true;
                    } else {
                        item.isDownloadVisible = false;
                    }
                });

                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setData(data);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
            },

            readOnlyInputFun: function () {
                this.getView().byId('buyer').setValueHelpOnly(true);
                this.getView().byId('category').setValueHelpOnly(true);
                this.getView().byId('itemCode').setValueHelpOnly(true);
                this.getView().byId('oldCadReq').setValueHelpOnly(true);
                this.getView().byId('cadDetailNo').setValueHelpOnly(true);
                this.getView().byId('dUnit').setValueHelpOnly(true);
            },

            getEnableDisableAPIFun: async function (sstageCode) {
                await this.createNewModelUsingAPI(
                    'GET',
                    "/odata/v4/stoneman-crf/MCrfControls?$expand=Detail&$filter=RoleCode_RoleCode_RoleConstant eq '" +
                    RoleInfo.RoleCode +
                    "' and StageCode_StageCode_StageConstant eq '" +
                    sstageCode +
                    "'",
                    '',
                    'enableModel'
                );
                let oenableModel = this.getView().getModel('enableModel');
                enableDisableArray = [];
                if (oenableModel.oData.value.length != 0) {
                    this.updateControlStates(oenableModel.oData.value[0].Detail);
                } else {
                    this.getAllDisableControls();
                }
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                    this.getAssignProdEnggAPI(buyerCode);
                }
            },

            getEnableDisableAPIForApproveRejectBtn: async function () {
                sstageCode = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/StageCode_StageConstant');
                var body = {
                    CRFGUID: this.getListViewEditPropertyValue(),
                    LOGINGUID: RoleInfo.UserID,
                    ROLECODE: RoleInfo.RoleCode,
                    STAGECODE: sstageCode
                };
                await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-crf/EnableAndDisable', body, 'myModel');
                let myModel = this.getView().getModel('myModel');
                let datamodel = myModel.getData();

                if (datamodel) {
                    enableDisableArrayForBtn = [];
                    if (datamodel.value.length != 0) {
                        enableDisableArrayForBtn = datamodel.value;
                        this.updateControlStatesForBtn(enableDisableArrayForBtn);
                    }
                }
            },

            updateControlStatesForBtn: function (enableDisableArrayForBtn) {
                var view = this.getView();
                enableDisableArrayForBtn.forEach(function (item) {
                    var control = view.byId(item.CONTROLID);
                    if (control && control.setEnabled) {
                        control.setEnabled(item.ENABLED);
                    }
                });
            },

            getAllDisableControls: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/MCrfControls?$filter=RoleCode eq ${null} and StageCode eq ${null} and FormType eq 'CRF'&$expand=Detail`,
                    '',
                    'enableDisableAllValueModel'
                );
                let oenableDisableModel = this.getView().getModel('enableDisableAllValueModel');
                if (oenableDisableModel.oData.value.length != 0) {
                    this.updateControlStates(oenableDisableModel.oData.value[0].Detail);
                }
            },

            getAssignProdEnggAPI: async function (buyerCode) {
                var oSelect = this.byId('assignProdEng');
                oSelect.setSelectedKey(''); // This will reset the selected key to blank
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/MUser?$expand=Buyer($filter=BuyerCode eq '${buyerCode}')&$filter=UserRoleCode_RoleCode_RoleConstant eq 'PRODUCT_ENGG'`,
                    '',
                    'AssgnEnggModel'
                );
                let oAssgnEnggModel = this.getView().getModel('AssgnEnggModel');
                let aData = oAssgnEnggModel.getData();
                aData.value.unshift({ UserID: '', Username: 'Please Select' });
                aData.value = oAssgnEnggModel.oData.value;
                oAssgnEnggModel.setData(aData);
                this.getView().setModel(oAssgnEnggModel, 'AssgnEnggModel');
            },

            onSelectAssnProdEng: function (oEvent) {
                let oSelectedItem = oEvent.getSource().getSelectedItem();
                let sSelectedKey = oEvent.getSource().getSelectedKey();
                let sSelectedText = oSelectedItem.getText();
                this._sSelectedValue = sSelectedText;
                this._sSelectedUserID = sSelectedKey;
                this.onAddToTable();
            },

            onAddToTable: function () {
                let oTableModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let aTableItems = oTableModel.getProperty('/InspDraw');
                aTableItems.forEach(
                    function (item) {
                        item.AssignProd = this._sSelectedValue;
                        item.DraftUserID_UserID = this._sSelectedUserID;
                    }.bind(this)
                );
                oTableModel.refresh();
            },

            populateItemGroupDropDown: async function () {
                await this.createNewModelUsingAPI('GET', '/sap/opu/odata4/sap/api_productgroup_2/srvd_a2x/sap/productgroup/0001/ProductGroup', '', 'reqModel');
                this.populateSelect('itemGroup', 'reqModel', 'value', 'Product', 'ProductGroup');
            },

            getAllExpendData: function (aData) {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var oData = oModel.getData();
                oModel.setProperty('/MerchantHead', aData.MerTeamHead.Username);
                oModel.setProperty('/MerchantTL', aData.MerTL.Username);
                oModel.setProperty('/MerchantATL', aData.MerATL.Username);
                oModel.setProperty('/technouser', aData.TechnoUserId.Username);
                oModel.setProperty('/qualityTL', aData.QualityTLUserId.Username);
                oModel.setProperty('/qualityATL', aData.QualityATLUserId.Username);
                oModel.setProperty('/Designer', aData.DesignerUserId.Username);
                oModel.setProperty('/PDCoordinator', aData.PDCUserId.Username);
                if (aData.PDCAttachmentAbsId != null) {
                    oModel.setProperty('/PDDRADisplayName', aData.PDCAttachmentAbsId.DisplayName);
                }

                oData.appliDiamter = aData.appliDiamter === 'Y' ? true : false;
                oData.appliDimension = aData.appliDimension === 'Y' ? true : false;
                oModel.setProperty('/isDiamter', oData.appliDiamter);
                oModel.setProperty('/isDimension', oData.appliDimension);
                oModel.setProperty('/StageCode_StageConstant', aData.CrfStageCode_StageCode_StageConstant);

                oData.UserAssign.forEach(function (item) {
                    if (item.UserID != null) {
                        item.UserName = item.UserID.Username;
                    }
                });
                oData.SeekAdvice.forEach(function (item) {
                    if (item.UserID != null) {
                        item.userName = item.UserID?.Username;
                        item.roleName = item.RoleCode.RoleName;
                    }
                });
                oData.InspDraw.forEach(function (item) {
                    if (item.DraftUserID != null) {
                        item.AssignProd = item.DraftUserID.Username;
                        item.AttachFileName = item.InspRefDocAbsId?.DisplayName;
                    }
                    if (item.InspRefDocAbsId_AbsId != null) {
                        item.AttachFileName = item.InspRefDocAbsId?.DisplayName;
                    }
                });
                oModel.setData(oData);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
            },

            getStageFieldApi: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/MStage?$filter=OrderBy eq 1 and FormType eq ' + "'CRF'",
                    '',
                    'stgModel'
                );
                let stgModel = this.getView().getModel('stgModel');
                let aData = {};
                aData.ApprStatus = 'NA'; // Default value
                aData.CrfStatus = 'New';
                let x = this.getView().getModel(this.getEntryFormDataSourceModelName());
                x.setProperty('/StageCode_StageConstant', stgModel.getProperty('/value/0/StageCode_StageConstant'));
                x.setProperty('/CrfStageName', stgModel.getProperty('/value/0/StageName'));
                x.setProperty('/ApprStatus', 'NA');
                x.setProperty('/CrfStatus', 'New');
                x.setProperty('/SeekAdvice', []);
            },

            cflForBuyer: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['BusinessPartner', 'Customer', 'Supplier', 'BusinessPartnerName']);
                this.setCflDataColumns(['BusinessPartner', 'Customer', 'Supplier', 'BusinessPartnerName']);
                this.setCflValueAndDisplay('/BuyerName', 'BusinessPartnerName', '', '');
                this.setCflSearchProperty('BusinessPartnerName');
                this.showCfl('buyer', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForBuyer.bind(this));
            },

            onClosecflForBuyer: function () {
                let oBuyerRes = this.getCflObject();
                let oBuyerSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oBuyerSetData.setProperty('/BuyerCode', oBuyerRes.BusinessPartner);
                this.onBuyerSelectionOtherFiledAPIFun();
            },

            cflForCategory: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/YY1_ExtProdGrp',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['External Product Group', 'External Product Group Name']);
                this.setCflDataColumns(['ExternalProductGroup', 'ExternalProductGroupName']);
                this.setCflValueAndDisplay('/Category', 'ExternalProductGroupName', '', '');
                this.setCflSearchProperty('ExternalProductGroupName');
                this.showCfl('category', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForCategory.bind(this));
            },

            onClosecflForCategory: function () {
                let oCategoryRes = this.getCflObject();
                let oCategorySetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oCategorySetData.setProperty('/MCatCode', oCategoryRes.ExternalProductGroup);
                this.onBuyerSelectionOtherFiledAPIFun();
            },

            cflForUoM: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Unit of Measure', 'Unit of Measure Name']);
                this.setCflDataColumns(['UnitOfMeasure', 'UnitOfMeasureLongName']);
                this.setCflValueAndDisplay('/UnitCode', 'UnitOfMeasure', '', '');
                this.setCflSearchProperty('UnitOfMeasureLongName');
                this.showCfl('dUnit', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForUoM.bind(this));
            },

            onClosecflForUoM: function () {
                let oUoMRes = this.getCflObject();
                let oUoMResSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oUoMResSetData.setProperty('/UnitName', oUoMRes.UnitOfMeasureLongName);
            },

            cflForMaterialCategory: async function (oEvent) {
                var oSource = oEvent.getSource();
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());
                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                this.setCflTitle('Material List');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/YY1_ExtProdGrp?$top=1000',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Material Code', 'Material Name']);
                this.setCflDataColumns(['ExternalProductGroup', 'ExternalProductGroupName']);
                this.setCflValueAndDisplay(`/Buyer/${irowIndex}/MCatCode`, 'ExternalProductGroup', '', '');
                this.setCflSearchProperty('ExternalProductGroupName');
                this.showCfl(
                    'categoryCode',
                    this.getCflListViewDataSourceModelName(),
                    'd/results',
                    this.onConfirmforMaterial.bind(this),
                    this.onCancelforMaterial.bind(this)
                );
            },

            onConfirmforMaterial: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/Material/${irowIndex}/MaterialCatHanaText`, x.ExternalProductGroupName);
                this.onCheckMaterialCatType(x.ExternalProductGroup);
            },

            onCancelforMaterial: function () { },

            cflForItemCode: async function () {
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let itemGroup = y.getProperty('/ItemGroup');
                var sKey = this.byId('itemGroup').getSelectedKey();
                await this.createNewModelUsingAPI(
                    "GET",
                    `/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product?$expand=to_Description&$filter=ProductGroup eq '${itemGroup}'`,
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                let data = this.getView().getModel(this.getCflListViewDataSourceModelName()).getData();
                let newItemGroupArr = []
                data["d"]["results"].forEach((item) => {
                    newItemGroupArr.push(...item["to_Description"]["results"]);
                })
                this.getView().getModel(this.getCflListViewDataSourceModelName()).setData({ "value": newItemGroupArr });
                this.setCflDisplayColumns(['Product', 'ProductDescription']);
                this.setCflDataColumns(['Product', 'ProductDescription']);
                this.setCflValueAndDisplay('/ItemCode', 'Product', '', '');
                this.setCflSearchProperty('ItemCode');
                this.showCfl('itemCode', this.getCflListViewDataSourceModelName(), `value`, this.onClosecflForItemCode.bind(this)
                );
            },

            onClosecflForItemCode: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty('/ItemDesc', x.ProductDescription);
            },

            cflForDeptPddra: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                this.setCflTitle('Department List');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2?$top=1000',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflDataColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflValueAndDisplay(`/UserAssign/${rowIndex}/DepartmentCode`, 'CostCenter', '', '');
                this.setCflSearchProperty('CostCenterName');
                this.showCfl(
                    'departmentMeeting',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onConfirmforDeptPddra.bind(this),
                    this.onCancelforDeptPddra.bind(this)
                );
            },

            onConfirmforDeptPddra: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/UserAssign/${irowIndex}/DepartmentName`, x.CostCenterName);
            },
            onCancelforDeptPddra: function () { },

            cflForUserPddra: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                this.setCflTitle('User List');
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let costcenter = y.getProperty(`/UserAssign/${rowIndex}/DepartmentCode`);
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=UserRoleCode",
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Username', 'Usercode']);
                this.setCflDataColumns(['Username', 'Usercode']);
                this.setCflValueAndDisplay(`/UserAssign/${rowIndex}/UserName`, 'Username', '', '');
                this.setCflSearchProperty('UserName');
                this.showCfl(
                    'pddrraUserName',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onConfirmforPDDRA.bind(this),
                    this.onCancelforUserPDDRA.bind(this)
                );
            },

            cflForDeptSeek: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                this.setCflTitle('Department List');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflDataColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflValueAndDisplay(`/SeekAdvice/${rowIndex}/DepartmentCode`, 'CostCenter', '', '');
                this.setCflSearchProperty('CostCenterName');
                this.showCfl(
                    'cadSeekDept',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onConfirmforDeptSeek.bind(this),
                    this.onCancelforDeptSeek.bind(this)
                );
            },

            onConfirmforDeptSeek: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SeekAdvice/${irowIndex}/DepartmentName`, x.CostCenterName);
            },

            onCancelforDeptSeek: function () { },

            cflForUserSeek: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                this.setCflTitle('User List');
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let costcenter = y.getProperty(`/SeekAdvice/${rowIndex}/DepartmentCode`);
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=UserRoleCode",
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Username', 'Usercode']);
                this.setCflDataColumns(['Username', 'Usercode']);
                this.setCflValueAndDisplay(`/SeekAdvice/${rowIndex}/userName`, 'Username', '', '');
                this.setCflSearchProperty('Username');
                this.showCfl(
                    'cadSeekUser',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onConfirmforSeekAdvice.bind(this),
                    this.onCancelforSeekAdvice.bind(this)
                );
            },

            onConfirmforSeekAdvice: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/SeekAdvice/${irowIndex}/UserID_UserID`, x.UserID);
                y.setProperty(`/SeekAdvice/${irowIndex}/RoleCode_RoleCode_RoleConstant`, x.UserRoleCode_RoleCode_RoleConstant);
                y.setProperty(`/SeekAdvice/${irowIndex}/roleName`, x.UserRoleCode.RoleName);
            },

            onCancelforSeekAdvice: function () { },

            onConfirmforPDDRA: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/UserAssign/${irowIndex}/UserID_UserID`, x.UserID);
                y.setProperty(`/SeekAdvice/${irowIndex}/RoleCode_RoleCode_RoleConstant`, x.UserRoleCode_RoleCode_RoleConstant);
            },

            onCancelforUserPDDRA: function () { },

            cflForOldCadReqNumber: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/TCrfHeader',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Old CAD Req No.']);
                this.setCflDataColumns(['CrfReqNo']);
                this.setCflValueAndDisplay('/OldCrfReqNo', 'CrfReqNo', '', '');
                this.setCflSearchProperty('CrfReqNo');
                this.showCfl('oldCadReq', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflOldCadReqNumber.bind(this));
            },

            onClosecflOldCadReqNumber: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty('/CrfReqUUID', x.CrfReqUUID);
                this.onChangeOldCrfReqNo();
            },

            cflForCADDetailNumber: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/TCadDetail' + `?$filter=CrfStatus eq 'CLS'`,
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['Cad Detail No', 'Cad Detail UUID']);
                this.setCflDataColumns(['CadDetailNo', 'CadDetailUUID']);
                this.setCflValueAndDisplay('/OldCADNo', 'CadDetailNo', '', '');
                this.setCflSearchProperty('CadDetailNo');
                this.showCfl('cadDetailNo', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflCADDetailNumber.bind(this));
            },

            onClosecflCADDetailNumber: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());

                y.setProperty('/CrfReqUUID_CrfReqUUID', x.CrfReqUUID_CrfReqUUID);
                y.setProperty('/OldCADUUID', x.CadDetailUUID);
                this.onChangeCADDetailNo();
            },

            onFileChange: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter('files'); // Get all selected files
                var oTable = this.byId('cadTable');
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                // Store the file data for the specific row
                this._fileDataAttachment[iRowIndex] = aFiles[0];

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024; // 5MB in bytes
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show('File size exceeds the limit of 10MB.');
                    oFileUploader.setValue(''); // Clear the FileUploader
                    return;
                }

                if (!this._aBase64Files) {
                    this._aBase64Files = [];
                }
                if (this._fileDataAttachment.length) {
                    // Initialize an array to store the base64 strings

                    for (var i = 0; i < this._fileDataAttachment.length; i++) {
                        this._readFileAsBase64(this._fileDataAttachment[i], i, iRowIndex);
                    }
                } else {
                    MessageToast.show('No file selected');
                }
            },

            _readFileAsBase64: function (oFile, iIndex, iRowIndex) {
                if (!oFile) {
                    this._aBase64Files[iIndex] = {
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
                    var base64String = event.target.result.split(',')[1];
                    var fileData = {
                        extension: oFile.name.split('.').pop(),
                        fileName: oFile.name.split('.')[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64Files[iIndex] = fileData;
                    if (iIndex === iRowIndex) {
                        MessageToast.show('File Upload successfully: ' + oFile.name);
                    }
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show('Error reading file: ' + error);
                };
                reader.readAsDataURL(oFile);
            },

            onFileChangePDDRAMeeting: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter('files'); // Get all selected files

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024;
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show('File size exceeds the limit of 10MB.');
                    oFileUploader.setValue('');
                    return;
                }
                if (aFiles.length) {
                    for (var i = 0; i < aFiles.length; i++) {
                        this._readFileAsBase64PDDRAMeeting(aFiles[i], i);
                    }
                } else {
                    MessageToast.show('No file selected');
                }
            },

            _readFileAsBase64PDDRAMeeting: function (oFile) {
                this._aBase64FilesPDDRAMeeting = {};
                var reader = new FileReader();
                reader.onload = function (event) {
                    var base64String = event.target.result.split(',')[1]; // Remove the Data URL prefix

                    var fileData = {
                        //extension: oFile.type.split("/")[1],
                        extension: oFile.name.split('.').pop(),
                        fileName: oFile.name.split('.')[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64FilesPDDRAMeeting = fileData;
                    MessageToast.show('File Upload successfully: ' + oFile.name);
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show('Error reading file: ' + error);
                };
                reader.readAsDataURL(oFile);
            },

            onFileChangeDesigner: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter('files'); // Get all selected files
                var oTable = this.byId('cadTable');
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                // Store the file data for the specific row
                this._fileDataAttachment[iRowIndex] = aFiles[0];

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024;
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show('File size exceeds the limit of 10MB.');
                    oFileUploader.setValue('');
                    return;
                }
                if (aFiles.length) {
                    for (var i = 0; i < aFiles.length; i++) {
                        this._readFileAsBase64Designer(aFiles[i], i, iRowIndex);
                    }
                } else {
                    MessageToast.show('No file selected');
                }
                this.onAttachDesigner(aFiles);
            },

            _readFileAsBase64Designer: function (oFile, iIndex, iRowIndex) {
                if (!oFile) {
                    this._aBase64Files[iIndex] = {
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
                    var base64String = event.target.result.split(',')[1];
                    var fileData = {
                        //extension: oFile.type.split("/")[1],
                        extension: oFile.name.split('.').pop(),
                        fileName: oFile.name.split('.')[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64Files[iIndex] = fileData;
                    if (iIndex === iRowIndex) {
                        MessageToast.show('File Upload successfully: ' + oFile.name);
                    }
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show('Error reading file: ' + error);
                };
                reader.readAsDataURL(oFile);
            },

            onAttachDesigner: function (aFiles) {
                var oTableModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aTableItems = oTableModel.getProperty('/InspDraw');
                const maxGroupId = aTableItems.reduce(
                    (max, person) => (person.GroupId > max ? person.GroupId : max),
                    aTableItems[0].GroupId
                );
                const filteredData = aTableItems.filter((item) => item.GroupId === maxGroupId);
                filteredData.forEach(
                    function (item) {
                        item.DraftRemarks = aFiles[0].name;
                    }.bind(this)
                );
                oTableModel.refresh();
            },

            onFileChangeTech: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter('files'); // Get all selected files
                var oTable = this.byId('cadTable');
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                // Store the file data for the specific row
                this._fileDataAttachment[iRowIndex] = aFiles[0];

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024;
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show('File size exceeds the limit of 10MB.');
                    oFileUploader.setValue('');
                    return;
                }
                if (aFiles.length) {
                    for (var i = 0; i < aFiles.length; i++) {
                        this._readFileAsBase64Tech(aFiles[i], i, iRowIndex);
                    }
                } else {
                    MessageToast.show('No file selected');
                }
                this.onAttachTech(aFiles);
            },

            _readFileAsBase64Tech: function (oFile, iIndex, iRowIndex) {
                if (!oFile) {
                    this._aBase64Files[iIndex] = {
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
                    var base64String = event.target.result.split(',')[1];
                    var fileData = {
                        //extension: oFile.type.split("/")[1],
                        extension: oFile.name.split('.').pop(),
                        fileName: oFile.name.split('.')[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };
                    this._aBase64Files[iIndex] = fileData;
                    if (iIndex === iRowIndex) {
                        MessageToast.show('File Upload successfully: ' + oFile.name);
                    }
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show('Error reading file: ' + error);
                };
                reader.readAsDataURL(oFile);
            },

            onAttachTech: function (aFiles) {
                var oTableModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aTableItems = oTableModel.getProperty('/InspDraw');
                const maxGroupId = aTableItems.reduce(
                    (max, person) => (person.GroupId > max ? person.GroupId : max),
                    aTableItems[0].GroupId
                );
                const filteredData = aTableItems.filter((item) => item.GroupId === maxGroupId);
                filteredData.forEach(
                    function (item) {
                        item.TechRemarks = aFiles[0].name;
                    }.bind(this)
                );
                oTableModel.refresh();
            },

            onFileChangeSeekAdvice: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var aFiles = oEvent.getParameter('files'); // Get all selected files
                var oTable = this.byId('seekAdviceTable');
                var iRowIndex = oTable.indexOfItem(oFileUploader.getParent().getParent());
                // Store the file data for the specific row
                this._fileData[iRowIndex] = aFiles[0];

                if (FileTypesConfig.allowedFileTypes.indexOf(aFiles[0].name.split('.').pop()) === -1) {
                    MessageToast.show('Please upload a PDF, image, text, markdown, Excel, PowerPoint, Word, Email or CAD-related file.');
                    oFileUploader.setValue('');
                    return;
                }

                var iMaxFileSize = 10 * 1024 * 1024; // 5MB in bytes
                if (aFiles[0].size > iMaxFileSize) {
                    MessageToast.show('File size exceeds the limit of 10MB.');
                    oFileUploader.setValue(''); // Clear the FileUploader
                    return;
                }
                if (!this._aBase64FilesSeekAdvice) {
                    this._aBase64FilesSeekAdvice = [];
                }
                // Read files as base64
                // if (this._fileData.length) {
                //     for (var i = 0; i < this._fileData.length; i++) {
                //         this._readFileAsBase64SeekAdvice(this._fileData[i], i, iRowIndex);
                //     }
                // } else {
                //     MessageToast.show('No file selected');
                // }
                this._readFileAsBase64SeekAdvice(this._fileData[iRowIndex], iRowIndex, iRowIndex);

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
                    var base64String = event.target.result.split(',')[1]; // Remove the Data URL prefix
                    var fileData = {
                        //extension: oFile.type.split("/")[1],
                        extension: oFile.name.split('.').pop(),
                        fileName: oFile.name.split('.')[0],
                        fileSize: oFile.size,
                        displayName: oFile.name,
                        base64String: base64String
                    };

                    this._aBase64FilesSeekAdvice[iIndex] = fileData;

                    if (iIndex === iRowIndex) {
                        MessageToast.show('File Upload successfully: ' + oFile.name);
                    }
                }.bind(this);
                reader.onerror = function (error) {
                    MessageToast.show('Error reading file: ' + error);
                };
                reader.readAsDataURL(oFile);
            },

            onUploadPress: async function (oEvent) {
                let oPayload = [];
                let checkAssign = this.byId('fileUploader1').getValue();
                if (oEvent) {
                    let oButton = oEvent.getSource();
                    let sButtonId = oButton.getId();
                    let sButtonBaseId = sButtonId.split('--').pop();
                    if (sButtonBaseId === 'btnSave') {
                        saveorsubmit = 'SAVE';
                    } else if (sButtonBaseId === 'btnSubmit') {
                        saveorsubmit = 'SUBMIT';

                    }
                }

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();

                if (
                    oSelectDiamension &&
                    (oData.Length === '' ||
                        oData.TolLength === '' ||
                        oData.Width === '' ||
                        oData.TolWidth === '' ||
                        oData.Height === '' ||
                        oData.TolHeight === '' ||
                        oData.UnitCode === '')
                ) {
                    MessageToast.show('Please Enter Mandatory field');
                    return;
                }
                if (
                    (oSelectDiamension === undefined || oSelectDiamension === false) &&
                    (oData.Length === '' ||
                        oData.TolLength === '' ||
                        oData.Width === '' ||
                        oData.TolWidth === '' ||
                        oData.Height === '' ||
                        oData.TolHeight === '' ||
                        oData.UnitCode === '')
                ) {
                    MessageToast.show('Please Enter at least 0');
                    return;
                }
                if (
                    oSelectDiameter &&
                    (oData.DiaTop === '' ||
                        oData.TolDiaTop === '' ||
                        oData.DiaLeft === '' ||
                        oData.TolDiaLeft === '' ||
                        oData.DiaRight === '' ||
                        oData.TolDiaRight === '' ||
                        oData.DiaBottom === '')
                ) {
                    MessageToast.show('Please Enter Mandatory field');
                    return;
                }
                if (
                    (oSelectDiameter === undefined || oSelectDiameter === false) &&
                    (oData.DiaTop === '' ||
                        oData.TolDiaTop === '' ||
                        oData.DiaLeft === '' ||
                        oData.TolDiaLeft === '' ||
                        oData.DiaRight === '' ||
                        oData.TolDiaRight === '' ||
                        oData.DiaBottom === '')
                ) {
                    MessageToast.show('Please Enter at least 0');
                    return;
                }

                if (
                    this.isEmpty(oData.Category) ||
                    this.isEmpty(oData.CrfDelDate) ||
                    this.isEmpty(oData.CrfCategory) ||
                    this.isEmpty(oData.ReqTyp) ||
                    this.isEmpty(oData.InputType) ||
                    this.isEmpty(oData.LblTyp) ||
                    this.isEmpty(oData.ItemCode) ||
                    this.isEmpty(oData.PDDate)
                ) {
                    MessageToast.show('Please Fill Mandatory Fields');
                    return;
                }

                if (this.isEmpty(oData.technouser) || this.isEmpty(oData.qualityTL) || this.isEmpty(oData.qualityATL) || this.isEmpty(oData.Designer) || this.isEmpty(oData.MerchantATL) || this.isEmpty(oData.MerchantTL) || this.isEmpty(oData.MerchantHead) || this.isEmpty(oData.PDCoordinator)) {
                    MessageToast.show('Please Fill Buyer Based Users');
                    return;
                }
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR && this.isEmpty(oData.InspDraw[0].DraftUserID_UserID)) {
                    MessageToast.show('Please Select Assign Product Eng.');
                    return;
                }
                if (this.isEmpty(oData.UserAssign.length != 0) && RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                    MessageToast.show('Please Add at least one PDDRRA Meeting');
                    return;
                }
                if (oData.UserAssign && oData.UserAssign.length > 0 && RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                    if (!this.ValidateUserAssign(oData.UserAssign)) {
                        return;
                    }
                }
                if (oData.Material && oData.Material.length > 0) {
                    if (!this.ValidateMaterialTable(oData.Material) && isValidateMaterial) {
                        return;
                    }
                }
                if (oData.UserAssign != null) {
                    var duplicates = this.findDuplicateEntries(oData.UserAssign);
                    if (duplicates.length > 0) {
                        MessageToast.show('Duplicate User Found! Please Select Diffrent User', duplicates);
                        return;
                    }
                }
                if ((checkAssign === '' || checkAssign === null) &&
                    saveorsubmit == 'SUBMIT' &&
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR
                ) {
                    MessageToast.show('Please Select File Upload otherwise Save the form');
                    return;
                }

                this._aBase64Files.forEach(function (oFile, index) {
                    AttachmentData[index] = {
                        ActualFileName: oFile.fileName,
                        DisplayName: oFile.displayName,
                        FileExtension: '.' + oFile.extension,
                        Base64File: oFile.base64String
                    };
                });
                this._aBase64FilesSeekAdvice.forEach(function (oFile, index) {
                    if (oFile) {
                        SeekAdvice[index] = {
                            ActualFileName: oFile.fileName,
                            DisplayName: oFile.displayName,
                            FileExtension: "." + oFile.extension,
                            Base64File: oFile.base64String
                        };
                    } else {
                        SeekAdvice[index] = {
                            ActualFileName: "",
                            DisplayName: "",
                            FileExtension: "",
                            Base64File: ""
                        }; // Assign null if oFile is not present
                    }
                });
                let length = SeekAdvice.length;
                for (let i = 0; i < length; i++) {
                    if (SeekAdvice[i] == null) {
                        SeekAdvice[i] = {
                            ActualFileName: null,
                            DisplayName: null,
                            FileExtension: null,
                            Base64File: null
                        }
                    }
                }
                if (Object.entries(this._aBase64FilesPDDRAMeeting).length != 0) {
                    PDDRAMetting = {
                        ActualFileName: this._aBase64FilesPDDRAMeeting.fileName,
                        DisplayName: this._aBase64FilesPDDRAMeeting.displayName,
                        FileExtension: '.' + this._aBase64FilesPDDRAMeeting.extension,
                        Base64File: this._aBase64FilesPDDRAMeeting.base64String
                    };
                } else {
                    PDDRAMetting = null;
                }

                oPayload = {
                    CADDetail: false,
                    CRForm: true,
                    AttachmentData,
                    SeekAdvice,
                    PDDRAMetting,
                    MainAssembly: null,
                    SubAssembly: [],
                    ChildAssembly: []
                };
                console.log(oPayload);
                let isValid = (oPayload.AttachmentData.length !== 0) || (oPayload.PDDRAMetting != null) || (oPayload.SeekAdvice.length !== 0);
                // if ((this._aBase64Files.length !== 0) || ((typeof this._aBase64FilesPDDRAMeeting !== 'Object' || typeof this._aBase64FilesPDDRAMeeting !== null)) || (typeof absTechID !== 'Object')) {
                //     isValid = true;
                // } else {
                //     isValid = false;
                // }

                if (isValid) {
                    await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-attachment/Attachments', oPayload, 'attachModel');
                    let attachModel = this.getView().getModel('attachModel').getData();
                    console.log(attachModel);
                    if (
                        Array.isArray(attachModel.value) &&
                        typeof attachModel.value[0] === 'object' &&
                        'AttachmentData' in attachModel.value[0]
                    ) {
                        attachModel.value.forEach(function (item) {
                            if ('AttachmentData' in item) {
                                if (
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD ||
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR
                                ) {
                                    item.AttachmentData.forEach(function (ele) {
                                        absID.push(ele.AbsId);
                                    });
                                }
                                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG) {
                                    item.AttachmentData.forEach(function (ele) {
                                        absProdEnggID = ele.AbsId;
                                    });
                                }
                                if (
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL
                                ) {
                                    item.AttachmentData.forEach(function (ele) {
                                        absTechID = ele.AbsId;
                                    });
                                }
                            }

                            if ('SeekAdvice' in item) {
                                item.SeekAdvice.forEach(function (el) {
                                    absIDSeekAdvice.push(el.AbsId);
                                });
                            }

                            if ('PDDRAMetting' in item && item.PDDRAMetting !== null) {
                                absIDPDDRAMeeting = item.PDDRAMetting.AbsId;
                            } else {
                                absIDPDDRAMeeting = null;
                            }
                        });

                        oModel.setData(oData);
                        this.onSaveNew(absID, absProdEnggID, absTechID, absIDSeekAdvice, absIDPDDRAMeeting, saveorsubmit);
                    } else {
                        MessageToast.show(attachModel.value[0]);
                        return;
                    }
                }

                else {
                    this.onSaveNew(absID, absProdEnggID, absTechID, absIDSeekAdvice, absIDPDDRAMeeting, saveorsubmit);
                }
            },

            onDownloadFile: async function (oEvent) {
                var iIndex = oEvent
                    .getSource()
                    .getParent()
                    .getParent()
                    .getParent()
                    .indexOfItem(oEvent.getSource().getParent().getParent());
                var oView = this.getView();
                var oModel = oView.getModel(this.getEntryFormDataSourceModelName());
                var oDataAttachment = oModel.getProperty('/InspDraw/' + iIndex); // Adjust path based on your model structure
                var oDataSeekAdvice = oModel.getProperty('/SeekAdvice/' + iIndex);
                var oButton = oEvent.getSource();
                var sButtonId = oButton.getId();
                if (sButtonId.includes('downloadBtn')) {
                    var payload = {
                        ID: oDataAttachment.InspRefDocAbsId_AbsId
                    };
                }
                if (sButtonId.includes('downloadBtnTech')) {
                    var payload = {
                        ID: oDataAttachment.TechAttachementAbsID_AbsId
                    };
                }
                if (sButtonId.includes('downloadBtnProd')) {
                    var payload = {
                        ID: oDataAttachment.DraftAttachmentAbsId_AbsId
                    };
                }
                if (sButtonId.includes('pddrDownlod')) {
                    var payload = {
                        ID: oModel.oData.PDCAttachmentAbsId_AbsId
                    };
                }
                if (sButtonId.includes('seekDownloadBtn')) {
                    var payload = {
                        ID: oDataSeekAdvice.SeekAdviceDocAbsId_AbsId
                    };
                }
                await this.createNewModelUsingAPI(
                    'POST',
                    '/odata/v4/stoneman-attachment/GetAttachmentDataWithFile',
                    payload,
                    'downloadAttachModel'
                );
                const res = this.getApiResponseObject();
                if (res.success == true) {
                    let downloadAttachModel = this.getView().getModel('downloadAttachModel');

                    let data = downloadAttachModel.getData();

                    var sBase64 = data.value.Base64File;
                    var sFileType = data.value.FileExtension;
                    var actualFileName = data.value.ActualFileName;

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
                    aLink.download = actualFileName + sFileType; // Assuming file extension is part of sFileType
                    aLink.click();
                    MessageToast.show('File downloaded successfully.');
                } else {
                    MessageToast.show(res.object.responseJSON.error.message);
                }

            },

            onViewFile: async function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().getParent().indexOfItem(oEvent.getSource().getParent().getParent());
                var oView = this.getView();
                var oModel = oView.getModel(this.getEntryFormDataSourceModelName());
                var oDataAttachment = oModel.getProperty("/InspDraw/" + iIndex); // Adjust path based on your model structure
                var oDataSeekAdvice = oModel.getProperty("/SeekAdvice/" + iIndex); // Adjust path based on your model structure
                var oButton = oEvent.getSource();
                var sButtonId = oButton.getId();
                if (sButtonId.includes('viewBtn')) {
                    var payload = {
                        ID: oDataAttachment.InspRefDocAbsId_AbsId
                    };
                }
                if (sButtonId.includes('viewBtnTech')) {
                    var payload = {
                        ID: oDataAttachment.TechAttachementAbsID_AbsId
                    };
                }
                if (sButtonId.includes('viewBtnProd')) {
                    var payload = {
                        ID: oDataAttachment.DraftAttachmentAbsId_AbsId
                    };
                }
                if (sButtonId.includes('pddrrView')) {
                    var payload = {
                        ID: oModel.oData.PDCAttachmentAbsId_AbsId
                    };
                }
                if (sButtonId.includes('seekAttachBtn')) {
                    var payload = {
                        ID: oDataSeekAdvice.SeekAdviceDocAbsId_AbsId
                    };
                }


                // Make AJAX call to get the file
                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/GetAttachmentDataWithFile", payload, "viewAttachModel");
                const res = this.getApiResponseObject();
                if (res.success == true) {
                    let viewAttachModel = this.getView().getModel("viewAttachModel");
                    let data = viewAttachModel.getData();

                    let sBase64 = data.value.Base64File; // Adjust based on your API response
                    let sFileType = data.value.FileExtension; // Adjust based on your API response

                    // Create a Blob object from the base64 string
                    let byteCharacters = atob(sBase64);
                    let byteNumbers = new Array(byteCharacters.length);
                    for (var i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    var blob = new Blob([byteArray], { type: sFileType });

                    // Create a URL for the Blob
                    var sBlobUrl = URL.createObjectURL(blob);

                    // Display the attachment based on the file type
                    if (sFileType === ".pdf") {
                        var byteArray = new Uint8Array(byteNumbers);
                        var blob = new Blob([byteArray], { type: 'application/pdf' });
                        var sBlobUrl = URL.createObjectURL(blob);
                        var oPDFViewer = new PDFViewer();
                        this.getView().addDependent(oPDFViewer);
                        oPDFViewer.setSource(sBlobUrl);
                        oPDFViewer.open();
                    }
                    else if ((sFileType === ".png" || sFileType === ".avif" || sFileType === ".jpg" || sFileType === ".jpeg")) {
                        var oDialog = new Dialog({
                            title: "View Attachment",
                            content: new Image({
                                src: sBlobUrl,
                                width: "100%",
                                height: "100%"
                            }),
                            endButton: new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            })
                        });
                        oDialog.open();
                    } else {
                        MessageToast.show("Unsupported file type.");
                    }
                } else {
                    MessageToast.show(res.object.responseJSON.error.message);
                }

            },

            isEmpty: function (value) {
                return value === null || value === undefined || value === '';
            },

            validate: function () {
                return true;
            },

            addcadRow: function () {
                var newRow = {
                    InspRefNo: '1',
                    AttachFileName: null,
                    InspRefName: null,
                    Remarks: null,
                    RowNumber: 1
                };
                this.addRowToModelArray(this.getEntryFormDataSourceModelName(), 'InspDraw', newRow);
            },

            addAttachment: function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var data = oModel.getData();
                var rowLen = data.InspDraw.length;
                // if (rowLen >= 5) {
                //     MessageToast.show("Maximum of 5 rows can be added.");
                //     return;
                // }

                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG) {
                    const maxGroupId = data.InspDraw.reduce(
                        (max, person) => (person.GroupId > max ? person.GroupId : max),
                        data.InspDraw[0].GroupId
                    );
                    const filteredData = data.InspDraw.filter((item) => item.GroupId === maxGroupId);
                    // Example: Log the filtered data
                    console.log(filteredData);
                    filteredData.forEach(function (item) {
                        if (item.ApprovalStatus === 'REJECTED') {
                            data.InspDraw.push({
                                AssignProd: item.AssignProd,
                                ApprovalStatus: 'NA',
                                CrfReqID_CrfReqUUID: item.CrfReqID_CrfReqUUID,
                                DraftRemarks: '',
                                RowNumber: rowLen + 1,
                                InspRefName: item.InspRefName,
                                InspRefNo: item.InspRefNo,
                                InspRemarks: item.InspRemarks,
                                TechAttachementAbsID_AbsId: item.TechAttachementAbsID_AbsId,
                                InspRefDocAbsId_AbsId: item.InspRefDocAbsId_AbsId,
                                DraftAttachmentAbsId_AbsId: item.DraftAttachmentAbsId_AbsId,
                                DraftUserID_UserID: item.DraftUserID_UserID,
                                AttachFileName: item.InspRefDocAbsId.DisplayName,
                                isNewRowDraft: true,
                                isDownloadVisibleDraft: false,
                                isDownloadVisibleTech: false,
                                GroupId: maxGroupId + 1
                            });
                        }
                    });
                } else {
                    data.InspDraw.push({
                        isDownloadVisible: false,
                        isNewRow: true,
                        AssignProd: '',
                        DraftRemarks: '',
                        DraftAttachmentAbsId_AbsId: null,
                        RowNumber: rowLen + 1,
                        InspRefName: '',
                        InspRefNo: 'INSP00' + (rowLen + 1),
                        InspRemarks: '',
                        GroupId: 1,
                        ApprovalStatus: null,
                        DraftUserID_UserID: null,
                        CrfReqID_CrfReqUUID: null,
                        TechAttachementAbsID_AbsId: null
                    });
                }
                oModel.setData(data);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
                this._fileDataAttachment.push({
                    ActualFileName: null,
                    Base64File: null,
                    DisplayName: null,
                    FileExtension: null
                });
            },

            addMeeting: function (oEvent) {
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                console.log(oViewModel);
                var newRow = {
                    CallMeeting: 'Y',
                    CrfUserAttachmentAbsId_AbsId: null,
                    DepartmentName: null,
                    DepartmentCode: null,
                    IsMeetingAttended: null,
                    Remarks: null,
                    UserCode: null,
                    UserID_UserID: null,
                    DepartmentID: null,
                    UserID: null,
                    RowNumber: 0,
                    isEditable: true,
                    MeetingStartDate: oViewModel.UserAssign[0].MeetingStartDate,
                    MeetingEndDate: oViewModel.UserAssign[0].MeetingEndDate,
                    UserName: null,
                    UserEmailId: null,
                    CrfReqID_CrfReqUUID: this.getListViewEditPropertyValue(),
                    UserAvailable: null,
                    CrfUserAssgId: null
                };
                this.addRowInObj('UserAssign', newRow, 'RowNumber');
            },

            onDeleteMeeting: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), 'UserAssign', iIndex);
            },

            onDeleteMaterial: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), 'Material', iIndex);
            },

            addRowToModelArray: function (modelName, arrayName, newRow) {
                // Get the view's model
                let model = this.getView().getModel(modelName);

                // Get the data from the model
                let data = model.getData();

                // Check if the specified array exists in the data
                if (Array.isArray(data[arrayName])) {
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

            addRaiseQuery: function () {
                let newRow = {
                    RowNumber: 0,
                    isDownloadVisibleSeek: false,
                    isNewRow: true,
                    userName: null,
                    DepartmentName: null,
                    SeekAdviceDocAbsId_AbsId: null,
                    SeekAdviceID: '',
                    FormType: 'CRF',
                    UserID_UserID: null,
                    RoleID_RoleID: null,
                    roleName: null,
                    Question: null,
                    Answer: null,
                    NewAlert: 'Y',
                    SeekAdviceDocAbsId: null,
                    CrfReqID_CrfReqUUID: null,
                    QuestionFrom_UserID: null
                };
                this.addRowInObj('SeekAdvice', newRow, 'RowNumber');
            },

            addMaterialRow: function () {
                var newRow = {
                    MaterialAutoCode: null,
                    MaterialCatHanaText: null,
                    MaterialCatFreeText: null,
                    Remarks: null,
                    RowNumber: 0
                };
                this.addRowInObj('Material', newRow, 'RowNumber');
            },

            onDeleteSeekAdvice: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), 'SeekAdvice', iIndex);
            },

            onDeleteAttachment: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), 'InspDraw', iIndex);
            },

            openDialog: function (oEvent) {
                var oView = this.getView();
                var oSelectedRowContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName()); // Get the selected row context

                // Retrieve the data from the selected row
                var oModel = oSelectedRowContext.getModel();
                var sPath = oSelectedRowContext.getPath();
                var oSelectedData = oModel.getProperty(sPath);
                var dialog = new SeekAdviceCommentDialog(oView, 'Query', 'Query', this);
                //dialog.open();
                var oEventSource = oEvent.getSource();
                var oTableRow = oEventSource.getParent();
                var oTable = oTableRow.getParent();
                var iRowIndex = oTable.indexOfItem(oTableRow);
                // Store the row index and selected row context
                this._iRowIndex = iRowIndex;

                // Store the reference to the input field and table row context
                this._oInputField = oEventSource;
                var oSelectedRowContext = oTableRow.getBindingContext(this.getEntryFormDataSourceModelName());
                var oSelectedRowContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());

                this._oSelectedRowContext = oSelectedRowContext;

                dialog.open(oSelectedRowContext, oSelectedData);
            },

            openDialog: function (oEvent) {
                var oView = this.getView();
                var oSelectedRowContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName()); // Get the selected row context

                // Retrieve the data from the selected row
                var oModel = oSelectedRowContext.getModel();
                var sPath = oSelectedRowContext.getPath();
                var oSelectedData = oModel.getProperty(sPath);
                var dialog = new SeekAdviceCommentDialog(oView, 'Query', 'Query', this);
                //dialog.open();
                var oEventSource = oEvent.getSource();
                var oTableRow = oEventSource.getParent();
                var oTable = oTableRow.getParent();
                var iRowIndex = oTable.indexOfItem(oTableRow);
                console.log('Row Index:', iRowIndex);
                this._iRowIndex = iRowIndex;
                this._oSelectedRowContext = oSelectedRowContext;
                dialog.open(oSelectedRowContext, oSelectedData);
            },
            handleFragmentSelection: function (sReplyValue) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty(this._oSelectedRowContext.getPath() + '/Answer', sReplyValue);
            },

            openDialogApprove: function (oEvent) {
                var oView = this.getView();
                var oModelData = oView.getModel(this.getEntryFormDataSourceModelName()).getData();
                var dialog = new ApproveRejectFragment(oView, 'Comment', 'APPROVED', this, oModelData);
                dialog.open();
            },

            openDialogReject: function (oEvent) {
                var oView = this.getView();
                var oModelData = oView.getModel(this.getEntryFormDataSourceModelName()).getData();
                var dialog = new ApproveRejectFragment(oView, 'Comment', 'REJECTED', this, oModelData);
                //dialog.open();
                dialog.open();
            },

            getApproveRejectComment: function (sReplyValue) {
                let checkTechFile = this.byId('techAttachFile').getValue();
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                oModel.setProperty('/ApprComments', sReplyValue.Comment);
                oModel.setProperty('/ApprStatus', sReplyValue.Status);
                console.log(sReplyValue);
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL
                ) {
                    if (oData.CrfStageCode_StageCode_StageConstant === 'STG_BUYER_APPROVAL_PENDING' || checkTechFile === '') {
                        this.onSaveNew(absID, absProdEnggID, absTechID, absIDSeekAdvice, absIDPDDRAMeeting, null);
                    } else {
                        this.onUploadPress();
                    }
                }
            },

            populatePDAsignDropDown: async function () {
                await this.createNewModelUsingAPI('GET', '/sap/opu/odata4/sap/api_productgroup_2/srvd_a2x/sap/productgroup/0001/ProductGroup', '', 'reqModel');
                this.populateSelect('itemGroup', 'reqModel', 'value', 'Product', 'ProductGroup');
            },

            updateControlStates: function (enableDisableArray) {
                var view = this.getView();
                enableDisableArray.forEach(function (item) {
                    var control = view.byId(item.ControlId);
                    if (control && control.setEnabled) {
                        control.setEnabled(item.Enabled);
                    }
                });
                this.disableTablePDDRRA(enableDisableArray);
                this.disableTableMaterial(enableDisableArray);
                this.disableTableAttachment(enableDisableArray);
            },

            disableTablePDDRRA: function (enableDisableArray) {
                var view = this.getView();
                var oTable = view.byId('pddrraTable'); // Get the table by its ID
                if (oTable) {
                    var aItems = oTable.getItems(); // Get the items (rows) of the table
                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells(); // Get the cells (columns) of each row
                        oCells.forEach(function (item) {
                            var sControlId = item.getId();
                            sControlId = sControlId.replace('pddrraTable-0', '');
                            var controlState = enableDisableArray.find(function (controlItem) {
                                return sControlId.includes(controlItem.ControlId);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                // Check if the control has the setEnabled method and is in the response
                                item.setEnabled(controlState.Enabled); // Set the enabled state based on the API response
                            }
                        });
                    });
                }
            },

            disableTableMaterial: function (enableDisableArray) {
                console.log('Inside Disbale Table Material *******');
                var oTable = this.byId('matTable'); // Get the table by its ID
                if (oTable) {
                    var aItems = oTable.getItems(); // Get the items (rows) of the table

                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells(); // Get the cells (columns) of each row

                        oCells.forEach(function (item) {
                            var sControlId = item.getId();
                            sControlId = sControlId.replace('matTable-0', '');
                            var controlState = enableDisableArray.find(function (controlItem) {
                                //return controlItem.ControlId === sControlId;
                                return sControlId.includes(controlItem.ControlId);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                item.setEnabled(controlState.Enabled);
                            }
                        });
                    });
                }
            },

            disableTableAttachment: function (enableDisableArray) {
                var view = this.getView();
                var oTable = view.byId('cadTable'); // Get the table by its ID
                if (oTable) {
                    var aItems = oTable.getItems(); // Get the items (rows) of the table
                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells(); // Get the cells (columns) of each row
                        oCells.forEach(function (item) {
                            var sControlId = item.getId();
                            sControlId = sControlId.replace('cadTable-0', '');
                            var controlState = enableDisableArray.find(function (controlItem) {
                                return sControlId.includes(controlItem.ControlId);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                // Check if the control has the setEnabled method and is in the response
                                item.setEnabled(controlState.Enabled); // Set the enabled state based on the API response
                            }
                        });
                    });
                }
            },

            onEnableDisableChange: function (oEvent) {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                // Get selected key from the first dropdown
                var sSelectedKey = oEvent.getParameter('selectedItem').getKey();

                // Logic to enable/disable the second dropdown based on the selected key
                var bEnableSecondDropdown = sSelectedKey === 'N'; // Example logic

                // Update the model property to enable/disable the second dropdown
                oModel.setProperty('/isSecondDropdownEnabled', !bEnableSecondDropdown);

                // Set editable true if "Repeat" is selected, false otherwise
                if (sSelectedKey === 'R') {
                    this.byId('oldCadReq').setEditable(true);
                    this.byId('crfNo').setEditable(true);
                    this.byId('ecnNo').setEditable(true);
                    this.byId('carNo').setEditable(true);
                    this.byId('cadDetailNo').setEditable(true);
                } else {
                    this.byId('oldCadReq').setEditable(false);
                    this.byId('cadDetailNo').setEditable(false);
                    this.byId('crfNo').setEditable(false);
                    this.byId('ecnNo').setEditable(false);
                    this.byId('carNo').setEditable(false);
                }
                this.setDataOnReqTypeChange();
            },

            setDataOnReqTypeChange: function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty('/BuyerCode', null);
                this.byId('crfCategory').setValue(null);
                this.byId('oldCadReq').setValue(null);
                this.byId('cadDetailNo').setValue(null);
                this.byId('cadReqNo').setValue(null);
                this.byId('inputType').setValue(null);
                this.byId('category').setValue(null);
                this.byId('labelType').setValue(null);
                this.byId('buyer').setValue(null);
                this.byId('mercTeamHead').setValue(null);
                this.byId('merchantTL').setValue(null);
                this.byId('desginer').setValue(null);
                this.byId('merchantATL').setValue(null);
                this.byId('technoUser').setValue(null);
                this.byId('pdCoordinator').setValue(null);
                this.byId('qualityTL').setValue(null);
                this.byId('qualityATL').setValue(null);
                this.byId('itemGroup').setValue(null);
                this.byId('itemCode').setValue(null);
                this.byId('itemDesc').setValue(null);
                this.byId('cadDeliveryDate').setValue(null);
                this.byId('pdDate').setValue(null);
                this.byId('remarks').setValue(null);
                this.byId('ecnNo').setValue(null);
                this.byId('carNo').setValue(null);
                this.byId('crfNo').setValue(null);
                this.byId('buyer').setValue(null);
                this.byId('Dlength').setValue(0);
                this.byId('DTolerance').setValue(0);
                this.byId('Dwidth').setValue(0);
                this.byId('dWTolerance').setValue(0);
                this.byId('Dheight').setValue(0);
                this.byId('dHTolerance').setValue(0);
                this.byId('dUnit').setValue(null);
                this.byId('dITop').setValue(0);
                this.byId('dITTolerance').setValue(0);
                this.byId('dILeft').setValue(0);
                this.byId('dILTolerance').setValue(0);
                this.byId('dIRight').setValue(0);
                this.byId('dIRTolerance').setValue(0);
                this.byId('bottom').setValue(0);
                this.byId('approvalstatus').setValue('NA');
                oModel.setProperty('/Material', [
                    {
                        MaterialAutoCode: 'Material 1',
                        MaterialCatHanaText: null,
                        MaterialCatFreeText: null,
                        Remarks: null,
                        RowNumber: 1
                    }
                ]);
                this.getStageFieldApi();
                this.populatePDAsignDropDown();
            },

            onChangeOldCrfReqNo: async function () {
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqId = y.getProperty('/CrfReqUUID');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/TCrfHeader?$expand=MerTeamHead,MerTL,MerATL,TechnoUserId,PDCUserId,QualityATLUserId,QualityTLUserId,DesignerUserId,Material,InspDraw($expand=DraftUserID,DraftAttachmentAbsId,InspRefDocAbsId)&$filter=CrfReqUUID eq ' +
                    reqId,
                    '',
                    'reqModel'
                );
                let reqModel = this.getView().getModel('reqModel');
                let aData = reqModel.getData();
                let x = this.getView().getModel(this.getEntryFormDataSourceModelName());
                x.setProperty('/OldCADNo', reqModel.getProperty(null));
                x.setProperty('/OldCADUUID', reqModel.getProperty(null));
                x.setProperty('/CrfReqNo', reqModel.getProperty(null));
                x.setProperty('/BuyerName', reqModel.getProperty('/value/0/BuyerName'));
                x.setProperty('/BuyerCode', reqModel.getProperty('/value/0/BuyerCode'));
                x.setProperty('/InputType', reqModel.getProperty('/value/0/InputType'));
                x.setProperty('/MerReqDate', reqModel.getProperty('/value/0/MerReqDate'));
                x.setProperty('/Category', reqModel.getProperty('/value/0/Category'));
                x.setProperty('/ItemCode', reqModel.getProperty('/value/0/ItemCode'));
                x.setProperty('/ItemDesc', reqModel.getProperty('/value/0/ItemDesc'));
                x.setProperty('/ItemGroup', reqModel.getProperty('/value/0/ItemGroup'));
                x.setProperty('/LblTyp', reqModel.getProperty('/value/0/LblTyp'));
                x.setProperty('/Reamrks', reqModel.getProperty('/value/0/Reamrks'));
                x.setProperty('/Material', reqModel.getProperty('/value/0/Material'));
                x.setProperty('/MCatCode', reqModel.getProperty('/value/0/MCatCode'));
                x.setProperty(
                    '/CrfStageCode_StageCode_StageConstant',
                    reqModel.getProperty('/value/0/CrfStageCode_StageCode_StageConstant')
                );
                x.setProperty('/CrfStageName', reqModel.getProperty('/value/0/CrfStageName'));
                x.setProperty('/ApprStatus', reqModel.getProperty('/value/0/ApprStatus'));
                x.setProperty('/MerATL_UserID', reqModel.getProperty('/value/0/MerATL_UserID'));
                x.setProperty('/MerTeamHead_UserID', reqModel.getProperty('/value/0/MerTeamHead_UserID'));
                x.setProperty('/MerTL_UserID', reqModel.getProperty('/value/0/MerTL_UserID'));
                x.setProperty('/PDCUserId_UserID', reqModel.getProperty('/value/0/PDCUserId_UserID'));
                x.setProperty('/QualityATLUserId_UserID', reqModel.getProperty('/value/0/QualityATLUserId_UserID'));
                x.setProperty('/QualityTLUserId_UserID', reqModel.getProperty('/value/0/QualityTLUserId_UserID'));
                x.setProperty('/TechnoUserId_UserID', reqModel.getProperty('/value/0/TechnoUserId_UserID'));
                x.setProperty('/DesignerUserId_UserID', reqModel.getProperty('/value/0/DesignerUserId_UserID'));
                x.setProperty('/CrfDelDate', reqModel.getProperty('/value/0/CrfDelDate'));
                x.setProperty('/Length', reqModel.getProperty('/value/0/Length'));
                x.setProperty('/TolLength', reqModel.getProperty('/value/0/TolLength'));
                x.setProperty('/Width', reqModel.getProperty('/value/0/Width'));
                x.setProperty('/TolWidth', reqModel.getProperty('/value/0/TolWidth'));
                x.setProperty('/Height', reqModel.getProperty('/value/0/Height'));
                x.setProperty('/TolHeight', reqModel.getProperty('/value/0/TolHeight'));
                x.setProperty('/UnitCode', reqModel.getProperty('/value/0/UnitCode'));
                x.setProperty('/UnitName', reqModel.getProperty('/value/0/UnitName'));
                x.setProperty('/DiaTop', reqModel.getProperty('/value/0/DiaTop'));
                x.setProperty('/TolHeight', reqModel.getProperty('/value/0/TolHeight'));
                x.setProperty('/TolDiaTop', reqModel.getProperty('/value/0/TolDiaTop'));
                x.setProperty('/DiaLeft', reqModel.getProperty('/value/0/DiaLeft'));
                x.setProperty('/TolDiaLeft', reqModel.getProperty('/value/0/TolDiaLeft'));
                x.setProperty('/DiaRight', reqModel.getProperty('/value/0/DiaRight'));
                x.setProperty('/TolDiaRight', reqModel.getProperty('/value/0/TolDiaRight'));
                x.setProperty('/DiaBottom', reqModel.getProperty('/value/0/DiaBottom'));
                x.setProperty('/TolDiaBottom', reqModel.getProperty('/value/0/TolDiaBottom'));
                x.setProperty('/CrfCategory', reqModel.getProperty('/value/0/CrfCategory'));
                x.setProperty('/PDDate', reqModel.getProperty('/value/0/PDDate'));
                x.setProperty('/MerReqDate', reqModel.getProperty('/value/0/MerReqDate'));
                aData.value[0].Material.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                });
                this.getAllExpendData(aData.value[0]);
                this.getStageFieldApi();
            },

            onChangeCADDetailNo: async function () {
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqId = y.getProperty('/CrfReqUUID_CrfReqUUID');
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/TCrfHeader?$expand=MerTeamHead,MerTL,MerATL,TechnoUserId,PDCUserId,QualityATLUserId,QualityTLUserId,DesignerUserId,Material,InspDraw($expand=DraftUserID,DraftAttachmentAbsId,InspRefDocAbsId)&$filter=CrfReqUUID eq ' +
                    reqId,
                    '',
                    'cadDetailReqModel'
                );
                let cadReqModel = this.getView().getModel('cadDetailReqModel');
                let aData = cadReqModel.getData();
                let x = this.getView().getModel(this.getEntryFormDataSourceModelName());
                x.setProperty('/CrfReqNo', cadReqModel.getProperty(null));
                x.setProperty('/OldCrfReqNo', cadReqModel.getProperty('/value/0/CrfReqNo'));
                x.setProperty('/OldCADUUID', cadReqModel.getProperty('/value/0/OldCADUUID'));
                x.setProperty('/BuyerName', cadReqModel.getProperty('/value/0/BuyerName'));
                x.setProperty('/BuyerCode', cadReqModel.getProperty('/value/0/BuyerCode'));
                x.setProperty('/InputType', cadReqModel.getProperty('/value/0/InputType'));
                x.setProperty('/MerReqDate', cadReqModel.getProperty('/value/0/MerReqDate'));
                x.setProperty('/Category', cadReqModel.getProperty('/value/0/Category'));
                x.setProperty('/ItemCode', cadReqModel.getProperty('/value/0/ItemCode'));
                x.setProperty('/ItemDesc', cadReqModel.getProperty('/value/0/ItemDesc'));
                x.setProperty('/ItemGroup', cadReqModel.getProperty('/value/0/ItemGroup'));
                x.setProperty('/LblTyp', cadReqModel.getProperty('/value/0/LblTyp'));
                x.setProperty('/Reamrks', cadReqModel.getProperty('/value/0/Reamrks'));
                x.setProperty('/Material', cadReqModel.getProperty('/value/0/Material'));
                x.setProperty('/MCatCode', cadReqModel.getProperty('/value/0/MCatCode'));
                x.setProperty(
                    '/CrfStageCode_StageCode_StageConstant',
                    cadReqModel.getProperty('/value/0/CrfStageCode_StageCode_StageConstant')
                );
                x.setProperty('/CrfStageName', cadReqModel.getProperty('/value/0/CrfStageName'));
                x.setProperty('/ApprStatus', cadReqModel.getProperty('/value/0/ApprStatus'));
                x.setProperty('/MerATL_UserID', cadReqModel.getProperty('/value/0/MerATL_UserID'));
                x.setProperty('/MerTeamHead_UserID', cadReqModel.getProperty('/value/0/MerTeamHead_UserID'));
                x.setProperty('/MerTL_UserID', cadReqModel.getProperty('/value/0/MerTL_UserID'));
                x.setProperty('/PDCUserId_UserID', cadReqModel.getProperty('/value/0/PDCUserId_UserID'));
                x.setProperty('/QualityATLUserId_UserID', cadReqModel.getProperty('/value/0/QualityATLUserId_UserID'));
                x.setProperty('/QualityTLUserId_UserID', cadReqModel.getProperty('/value/0/QualityTLUserId_UserID'));
                x.setProperty('/TechnoUserId_UserID', cadReqModel.getProperty('/value/0/TechnoUserId_UserID'));
                x.setProperty('/DesignerUserId_UserID', cadReqModel.getProperty('/value/0/DesignerUserId_UserID'));
                x.setProperty('/CrfDelDate', cadReqModel.getProperty('/value/0/CrfDelDate'));
                x.setProperty('/Length', cadReqModel.getProperty('/value/0/Length'));
                x.setProperty('/TolLength', cadReqModel.getProperty('/value/0/TolLength'));
                x.setProperty('/Width', cadReqModel.getProperty('/value/0/Width'));
                x.setProperty('/TolWidth', cadReqModel.getProperty('/value/0/TolWidth'));
                x.setProperty('/Height', cadReqModel.getProperty('/value/0/Height'));
                x.setProperty('/TolHeight', cadReqModel.getProperty('/value/0/TolHeight'));
                x.setProperty('/UnitCode', cadReqModel.getProperty('/value/0/UnitCode'));
                x.setProperty('/UnitName', cadReqModel.getProperty('/value/0/UnitName'));
                x.setProperty('/DiaTop', cadReqModel.getProperty('/value/0/DiaTop'));
                x.setProperty('/TolHeight', cadReqModel.getProperty('/value/0/TolHeight'));
                x.setProperty('/TolDiaTop', cadReqModel.getProperty('/value/0/TolDiaTop'));
                x.setProperty('/DiaLeft', cadReqModel.getProperty('/value/0/DiaLeft'));
                x.setProperty('/TolDiaLeft', cadReqModel.getProperty('/value/0/TolDiaLeft'));
                x.setProperty('/DiaRight', cadReqModel.getProperty('/value/0/DiaRight'));
                x.setProperty('/TolDiaRight', cadReqModel.getProperty('/value/0/TolDiaRight'));
                x.setProperty('/DiaBottom', cadReqModel.getProperty('/value/0/DiaBottom'));
                x.setProperty('/TolDiaBottom', cadReqModel.getProperty('/value/0/TolDiaBottom'));
                x.setProperty('/CrfCategory', cadReqModel.getProperty('/value/0/CrfCategory'));
                x.setProperty('/PDDate', cadReqModel.getProperty('/value/0/PDDate'));
                x.setProperty('/MerReqDate', cadReqModel.getProperty('/value/0/MerReqDate'));
                aData.value[0].Material.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                });
                this.getAllExpendData(aData.value[0]);
                this.getStageFieldApi();
            },

            onSaveNew: async function (absID, absProdEnggID, absTechID, absIDSeekAdvice, absIDPDDRAMeeting, saveorsubmit) {
                let checkTech = this.byId('techAttachFile').getValue();
                // Create New Model Using API call attachment api get the reponse the same res
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();

                let oDateFormat = DateFormat.getDateInstance({ pattern: 'yyyy-MM-dd' });
                let crfDelDate = this.byId('cadDeliveryDate').getDateValue();
                let crfPDDate = this.byId('pdDate').getDateValue();
                let crfMerchantDate = this.byId('mercReqDate').getDateValue();
                var currentDate = new Date(); // Get the current date

                // Format the date to YYYY-MM-DD
                var formattedDate =
                    currentDate.getFullYear() +
                    '-' +
                    ('0' + (currentDate.getMonth() + 1)).slice(-2) +
                    '-' +
                    ('0' + currentDate.getDate()).slice(-2);

                let isMerchantRole =
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD;
                let isQualityOrTechnologistRole =
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                    oData.StageCode_StageConstant.includes('STG_BUYER_APPROVAL_PENDING');
                let isPDCoordinatorRole = RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR;
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel('CadRequestSaveRequestModel').getData();

                srcObject.CreatedByUserID_UserID = formMode === '3' ? RoleInfo.UserID : oData.CreatedByUserID_UserID;
                srcObject.appliDiamter = oData.isDiamter == true ? 'Y' : 'N';
                srcObject.appliDimension = oData.isDimension == true ? 'Y' : 'N';
                srcObject.loginUserID_UserID = RoleInfo.UserID;
                srcObject.MerReqDate = oData.ReqTyp == 'N' ? formattedDate : oDateFormat.format(crfMerchantDate);
                srcObject.CrfStatus = oData.CrfStatus;
                srcObject.CrfStageCode_StageCode_StageConstant = oData.StageCode_StageConstant;
                srcObject.SaveOrSubmit = saveorsubmit;
                srcObject.PDCAttachmentAbsId_AbsId = isPDCoordinatorRole ? absIDPDDRAMeeting : oData.PDCAttachmentAbsId_AbsId;
                srcObject.PDDate = oDateFormat.format(crfPDDate);
                srcObject.CrfDelDate = oDateFormat.format(crfDelDate);

                if (isQualityOrTechnologistRole || (isMerchantRole && oData.ApprStatus === 'APPROVED')) {
                    srcObject.TotalApproved = 0;
                    srcObject.TotalRejected = 0;
                    srcObject.newApprovalStatus = oData.ApprStatus;
                    srcObject.newApprovalComment = oData.ApprComments;
                }
                console.log(srcObject.InspDraw);
                const lastGroupId = Math.max(...srcObject.InspDraw.map((item) => item.GroupId || 0));
                srcObject.InspDraw.forEach(function (item, index) {
                    if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                        item.InspRefDocAbsId_AbsId = item.InspRefDocAbsId_AbsId;
                    }
                    if (
                        index < absID.length &&
                        (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD)
                    ) {
                        item.InspRefDocAbsId_AbsId = absID[index];
                    }
                    if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG && oData.ApprStatus === 'REJECTED') {
                        if (item.GroupId === lastGroupId) {
                            item.DraftAttachmentAbsId_AbsId = absProdEnggID; // Update with absProdID
                            item.TechAttachementAbsID_AbsId = null;
                        }
                    }
                    if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST && oData.ApprStatus === 'REJECTED') {
                        if (item.GroupId === lastGroupId) {
                            item.TechAttachementAbsID_AbsId = checkTech === '' ? null : absTechID;
                        }
                    }
                    if (
                        RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG &&
                        (oData.ApprStatus === 'NA' || oData.ApprStatus === null)
                    ) {
                        if (item.GroupId === lastGroupId) {
                            item.DraftAttachmentAbsId_AbsId = absProdEnggID; // Update with absProdID
                            item.TechAttachementAbsID_AbsId = null;
                        }
                    }

                    if (
                        (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL) &&
                        (oData.ApprStatus === 'NA' || oData.ApprStatus === null)
                    ) {
                        if (item.GroupId === lastGroupId) {
                            item.TechAttachementAbsID_AbsId = absTechID; // Update with absProdID
                        }
                    }

                    if (
                        (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                            RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD) &&
                        oData.ApprStatus === 'APPROVED'
                    ) {
                        if (item.GroupId === lastGroupId) {
                            item.DraftAttachmentAbsId_AbsId =
                                typeof absProdEnggID === 'object' && absProdEnggID !== null ? item.DraftAttachmentAbsId_AbsId : absProdEnggID; // Update with absProdID
                            item.TechAttachementAbsID_AbsId =
                                typeof absTechID === 'object' && absTechID !== null ? item.TechAttachementAbsID_AbsId : absTechID;
                        }
                    }
                });

                if (srcObject.SeekAdvice) {
                    srcObject.SeekAdvice.forEach(function (item, index) {
                        if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] != undefined) {
                            item.SeekAdviceDocAbsId_AbsId = absIDSeekAdvice[index];
                        }
                        else if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] === undefined) {
                            item.SeekAdviceDocAbsId_AbsId = item.SeekAdviceDocAbsId_AbsId;
                        }
                    })

                }
                else {
                    srcObject.SeekAdvice = null;
                }

                if (formMode == '2') {
                    srcObject.ApprovalTransaction.forEach(function (item) {
                        delete item.endDte;
                        delete item.startDte;
                    });
                } else {
                    srcObject.ApprovalTransaction = null;
                }

                if (formMode == '2') {
                    srcObject.UserAssign.forEach(function (item) {
                        item.MeetingStartDate = formatter.convertToISOFormat(item.MeetingStartDate);
                        item.MeetingEndDate = formatter.convertToISOFormat(item.MeetingEndDate);
                        delete item.isEditable;
                    });
                } else {
                    srcObject.UserAssign = [];
                }
                this.transferObjectValues(srcObject, trgObject);

                trgObject.UserAssign.forEach(function (item) {
                    if (item.CrfUserAssgId === null || item.CrfUserAssgId === '') {
                        delete item.CrfUserAssgId;
                    }
                });

                trgObject.InspDraw.forEach(function (ele) {
                    if (formMode == '3' || ele.InspID == null || ele.InspID.trim() === '') {
                        delete ele.InspID;
                    }
                });
                // if (oData.InspDraw[0].InspRefDocAbsId_AbsId === null) {
                //     MessageToast.show('Please Choose at least one Attach file.');
                //     return;
                // }
                console.log('requestObject', trgObject);
                await this.onPressOfEntryFormSaveButton(trgObject);
                const res = this.getApiResponseObject();

                //let response = this.getView().getModel(this.getEntryFormResponseDataSourceModelName()).getData();
                if (isMerchantRole && srcObject.ApprStatus !== 'APPROVED' && srcObject.ApprStatus !== 'REJECTED') {
                    if (res.success == true) {
                        MessageToast.show('CAD Created Successfully ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.status === 502) {
                        MessageToast.show(res.object.responseText);
                        return;
                    } else {
                        MessageToast.show(res.object.responseJSON.error.message);
                    }
                } else if (
                    isQualityOrTechnologistRole ||
                    (isMerchantRole && srcObject.ApprStatus === 'APPROVED') ||
                    (isMerchantRole && srcObject.ApprStatus === 'REJECTED')
                ) {
                    if (res.object.ApprStatus === 'APPROVED') {
                        MessageToast.show('CAD has been Approved Successfully For ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.object.ApprStatus === 'PENDING') {
                        MessageToast.show('CAD has been Approved Successfully For ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.object.ApprStatus === 'REJECTED') {
                        MessageToast.show('CAD Rejected Successfully For ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.status === 502) {
                        MessageToast.show(res.object.responseText);
                        return;
                    } else {
                        MessageToast.show(res.object.responseJSON.error.message);
                    }
                } else {
                    if (res.success == true) {
                        MessageToast.show('CAD Updated Successfully For ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            500
                        );
                    } else if (res.status === 502) {
                        MessageToast.show(res.object.responseText);
                        return;
                    } else {
                        MessageToast.show(res.object.responseJSON.error.message);
                    }
                }
            },

            onBuyerSelectionOtherFiledAPIFun: async function () {
                let oBuyerSetData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                //if (SelectedBuyerCode != undefined && catCode != undefined) { // needs to be double checked,if "catcode" is required or not
                if (oBuyerSetData.BuyerCode != undefined && oBuyerSetData.MCatCode != undefined) {
                    await this.createNewModelUsingAPI(
                        'GET',
                        `/odata/v4/stoneman-crf/MUser?$select=UserRoleCode_RoleCode_RoleConstant,Username&$expand=Buyer($filter=BuyerCode eq '${oBuyerSetData.BuyerCode}' and MCatCode eq '${oBuyerSetData.MCatCode}')`,
                        '',
                        'modelUser'
                    );
                    let omodelUser = this.getView().getModel('modelUser');
                    let oData = omodelUser.getData();
                    if (oData !== undefined) {
                        let oModel = this.getEntryFormModel();

                        if (oData.value.length > 0) {
                            var filteredData = oData.value.filter(function (item) {
                                // Filter the data where UserRoleCode_RoleCode_RoleConstant matches and Buyer is not empty
                                return (
                                    (item.UserRoleCode_RoleCode_RoleConstant === 'DTP_HEAD' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'PD_COORDINATOR' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'TECHNOLOGIST' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'DESIGNER' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'MERCHANT_ATL' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'MERCHANT_TL' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'HEAD' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'QUALITY_TL' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'QUALITY_ATL' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'PRODUCT_ENGG' ||
                                        item.UserRoleCode_RoleCode_RoleConstant === 'DTP_ASSISTANT') &&
                                    item.Buyer.length > 0
                                );
                            });

                            filteredData.forEach(function (item) {
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'HEAD') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/MerchantHead', selectedData);
                                    oModel.setProperty('/MerTeamHead_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'MERCHANT_TL') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/MerchantTL', selectedData);
                                    oModel.setProperty('/MerTL_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'DESIGNER') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/Designer', selectedData);
                                    oModel.setProperty('/DesignerUserId_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'MERCHANT_ATL') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/MerchantATL', selectedData);
                                    oModel.setProperty('/MerATL_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'TECHNOLOGIST') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/technouser', selectedData);
                                    oModel.setProperty('/TechnoUserId_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'QUALITY_TL') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/qualityTL', selectedData);
                                    oModel.setProperty('/QualityTLUserId_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'QUALITY_ATL') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/qualityATL', selectedData);
                                    oModel.setProperty('/QualityATLUserId_UserID', selectedDatabyID);
                                }
                                if (item.UserRoleCode_RoleCode_RoleConstant === 'PD_COORDINATOR') {
                                    var selectedData = item.Username;
                                    var selectedDatabyID = item.UserID;
                                    oModel.setProperty('/PDCoordinator', selectedData);
                                    oModel.setProperty('/PDCUserId_UserID', selectedDatabyID);
                                }
                            });
                            if (filteredData.length === 0) {
                                oModel.setProperty('/MerchantHead', '');
                                oModel.setProperty('/MerchantTL', '');
                                oModel.setProperty('/Designer', '');
                                oModel.setProperty('/MerchantATL', '');
                                oModel.setProperty('/technouser', '');
                                oModel.setProperty('/qualityTL', '');
                                oModel.setProperty('/qualityATL', '');
                                oModel.setProperty('/PDCoordinator', '');
                            }
                            console.log(filteredData);
                        }
                    }
                }
            },

            onPressLogout: function () {
                var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
                oStorage.put(null);
                sap.ui.getCore().getEventBus().publish('Logout', 'rowSelectEvent', '');
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo('RouteLogin', {}, true);
            },

            ValidateSeekAdvice: function (SeekAdvice) {
                let isValidSeekAdvice = true;
                for (let index = 0; index < SeekAdvice.length; index++) {
                    const item = SeekAdvice[index];
                    if (this.isEmpty(item.userName)) {
                        isValidSeekAdvice = false;
                        MessageToast.show('Please Enter User Name at row ' + (index + 1));
                        break;
                    } else if (this.isEmpty(item.Question)) {
                        isValidSeekAdvice = false;
                        MessageToast.show('Please Enter Query at row ' + (index + 1));
                        break;
                    }
                }
                return isValidSeekAdvice;
            },

            ValidateUserAssign: function (UserAssign) {
                let isValidUserAssign = true;
                for (let index = 0; index < UserAssign.length; index++) {
                    const item = UserAssign[index];
                    if (
                        this.isEmpty(item.CallMeeting) ||
                        this.isEmpty(item.DepartmentName) ||
                        this.isEmpty(item.UserName) ||
                        this.isEmpty(item.MeetingStartDate) ||
                        this.isEmpty(item.MeetingEndDate) ||
                        this.isEmpty(item.UserAvailable)
                    ) {
                        MessageToast.show('Please Fill Mandatory Columns for PDDRRA Meeting');
                        isValidUserAssign = false;
                        break;
                    }
                    if (item.UserAvailable === 'Not Available') {
                        MessageToast.show("Can't be Save due to User Not Available");
                        isValidUserAssign = false;
                        break;
                    }
                    if (this.isEmpty(item.IsMeetingAttended) && saveorsubmit == 'SUBMIT') {
                        MessageToast.show("Please Select Meeting Attended Column");
                        isValidUserAssign = false;
                        break;
                    }
                }
                return isValidUserAssign;
            },

            ValidateMaterialTable: function (Material) {
                var isValidMaterial = true;
                for (let index = 0; index < Material.length; index++) {
                    const item = Material[index];
                    if (this.isEmpty(item.MaterialCatFreeText) && isValidateMaterial) {
                        isValidMaterial = false;
                        MessageToast.show('Please Enter Material Category at row ' + (index + 1));
                        break;
                    }
                }
                return isValidMaterial;
            },

            onCheckMaterialCatType: function (materialCategoryCode) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aTableData = oModel.getProperty('/Material');

                if (materialCategoryCode === 'Z198') {
                    isValidateMaterial = true;
                } else {
                    isValidateMaterial = false;
                }
            },

            onUploadSeekAdvice: async function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                if (this.ValidateSeekAdvice(oData.SeekAdvice)) {
                    let oPayload = [];
                    this._aBase64Files.forEach(function (oFile, index) {
                        AttachmentData[index] =
                        {
                            ActualFileName: oFile.fileName,
                            DisplayName: oFile.displayName,
                            FileExtension: "." + oFile.extension,
                            Base64File: oFile.base64String
                        }
                    });
                    this._aBase64FilesSeekAdvice.forEach(function (oFile, index) {
                        SeekAdvice[index] =
                        {
                            ActualFileName: oFile.fileName,
                            DisplayName: oFile.displayName,
                            FileExtension: "." + oFile.extension,
                            Base64File: oFile.base64String
                        }
                    });

                    let length = SeekAdvice.length;
                    for (let i = 0; i < length; i++) {
                        if (SeekAdvice[i] == null) {
                            SeekAdvice[i] = {
                                ActualFileName: null,
                                DisplayName: null,
                                FileExtension: null,
                                Base64File: null
                            }
                        }
                    }

                    PDDRAMetting = null;
                    oPayload = {
                        CADDetail: false, CRForm: true, AttachmentData, SeekAdvice, PDDRAMetting, MainAssembly: null,
                        SubAssembly: [],
                        ChildAssembly: []
                    };
                    console.log(oPayload);
                    if (oPayload.SeekAdvice.length != 0) {
                        await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/Attachments", oPayload, "seekAttachModel");
                        let seekAttachModel = this.getView().getModel("seekAttachModel");
                        let data = seekAttachModel.getData();
                        data.value.forEach(function (item) {
                            if ('SeekAdvice' in item) {
                                absIDSeekAdvice = [];
                                item.SeekAdvice.forEach(function (el) {
                                    absIDSeekAdvice.push(el.AbsId);
                                })
                            }

                        })
                        oModel.setData(oData);
                        this.onSaveSeekAdvice(absIDSeekAdvice);
                    } else {
                        this.onSaveSeekAdvice(absIDSeekAdvice);
                    }

                    //  } 

                }

            },


            onSaveSeekAdvice: async function (absIDSeekAdvice) {
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel('SeekAdviceModel').getData();
                const lastRowNo = Math.max(...srcObject.SeekAdvice.map((item) => item.RowNumber || 0));

                srcObject.SeekAdvice.forEach(function (item, index) {
                    if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] != undefined) {
                        item.SeekAdviceDocAbsId_AbsId = absIDSeekAdvice[index];
                    }
                    else if (index < absIDSeekAdvice.length && absIDSeekAdvice[index] === undefined) {
                        item.SeekAdviceDocAbsId_AbsId = item.SeekAdviceDocAbsId_AbsId;
                    }
                })

                this.transferObjectValues(srcObject, trgObject);
                trgObject.CrfReqUUID = this.getListViewEditPropertyValue();
                await this.createNewModelUsingAPI(
                    'PATCH',
                    '/odata/v4/stoneman-crf/TCrfHeader' + `(${this.getListViewEditPropertyValue()})`,
                    trgObject,
                    'seekAttachModel'
                );
                let seekAttachModel = this.getView().getModel('seekAttachModel');
                let data = seekAttachModel.getData();
                if (data) {
                    MessageToast.show('Seek Advice Save successfully ' + data.CrfReqNo);
                    setTimeout(
                        function () {
                            this.router.navTo(this.getBackwardRoute());
                        }.bind(this),
                        1000
                    );
                }
            },


            onGenerateTimeSlots: function () {
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oTimeSlotModel = this.getView().getModel('TimeSlotModel');
                let odataModel = oViewModel.getData();
                let aTimeSlots = [];
                let iInterval = odataModel.TimeSlotMinutes;

                // Convert start and end time to Date objects
                let oStartTime = formatter._convertTimeToDateObject(odataModel.StartTime);
                let oEndTime = formatter._convertTimeToDateObject(odataModel.EndTime);

                if (!oStartTime || !oEndTime || !iInterval) {
                    MessageToast.show('Please enter valid start time, end time, and interval.');
                    return;
                }

                // Loop through the time slots
                while (oStartTime < oEndTime) {
                    let oNextSlot = new Date(oStartTime.getTime() + iInterval * 60000); // Add interval (30 minutes)

                    if (oNextSlot > oEndTime) break;

                    let sSlotStart = formatter._getfFormatTime(oStartTime);
                    let sSlotEnd = formatter._getfFormatTime(oNextSlot);

                    aTimeSlots.push({
                        SlotID: sSlotStart,
                        SlotDescription: sSlotStart + ' - ' + sSlotEnd
                    });

                    oStartTime = oNextSlot;
                }
                oTimeSlotModel.setData({ TimeSlots: aTimeSlots });
                this.getView().setModel(oTimeSlotModel, 'TimeSlotModel');
            },

            getMeetingDate: function (oEvent) {
                let formatedDate;
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let meetingDte = this.byId('meetingDte').getDateValue();
                if (meetingDte != null) {
                    formatedDate = formatter.getDateFromatIn_ddMMyyyy(meetingDte);
                }

                let meetingStartTime = this.byId('startTime').getDateValue();
                let meetingEndTime = this.byId('endTime').getDateValue();
                let timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: 'hh:mm a' });
                let formattedStartTime = timeFormat.format(meetingStartTime);
                let formattedEndTime = timeFormat.format(meetingEndTime);

                var aTableData = oViewModel.getProperty('/UserAssign');
                if (meetingDte === '' && meetingDte == null && meetingStartTime == null && meetingEndTime == null) {
                    MessageToast.show('Plase Select Date, Start Time & End Time');
                    return;
                }
                if (meetingStartTime > meetingEndTime) {
                    MessageToast.show('Invalid time range! Start time must be earlier than end time.');
                    return;
                }
                // Update the date in the first row (assuming single row for simplicity)
                if (aTableData && aTableData.length > 0) {
                    aTableData.forEach(function (item) {
                        if (meetingDte != undefined) {
                            item.MeetingStartDate = formatedDate + ', ' + formattedStartTime;
                            item.MeetingEndDate = formatedDate + ', ' + formattedEndTime;
                        }
                    });
                    oViewModel.setProperty('/UserAssign', aTableData);
                }
            },

            openTimeSlotDialog: function (oEvent) {
                this.onGenerateTimeSlots();
                var oView = this.getView();
                var oModelData = oView.getModel(this.getEntryFormDataSourceModelName()).getData();
                var dialog = new timeslotFragment(oView, 'Select Time Slot', 'APPROVED', this, aTimeSlots);
                dialog.open();
            },

            checkCallMettingActivity: function (oEvent) {
                // Get the view model assigned to the table
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());

                // Retrieve the data from the model for the table items
                var aTableData = oViewModel.getProperty('/UserAssign');

                // Check if data exists and has items
                if (aTableData && aTableData.length > 0) {
                    // Loop through each row in the table and clear the specified columns
                    aTableData.forEach(function (item) {
                        if (item.CallMeeting === 'N') {
                            item.MeetingStartDate = null;
                            item.MeetingEndDate = null;
                            item.UserAvailable = 'NA';
                        }
                    });
                    oViewModel.setProperty('/UserAssign', aTableData);
                } else {
                    sap.m.MessageToast.show('No data available to clear.');
                }
            },

            onClearTimePress: function () {
                // Get the view model assigned to the table
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());

                // Retrieve the data from the model for the table items
                var aTableData = oViewModel.getProperty('/UserAssign');

                // Check if data exists and has items
                if (aTableData && aTableData.length > 0) {
                    this.byId('meetingDte').setValue(null);
                    this.byId('startTime').setValue(null);
                    this.byId('endTime').setValue(null);
                    this.byId('timeSlotCombo').setValue(null);
                    // Loop through each row in the table and clear the specified columns
                    aTableData.forEach(function (item) {
                        item.MeetingStartDate = null;
                        item.MeetingEndDate = null;
                        item.UserAvailable = '';
                    });

                    // Update the model with the cleared data
                    oViewModel.setProperty('/UserAssign', aTableData);
                } else {
                    sap.m.MessageToast.show('No data available to clear.');
                }
            },

            getSelectedTime: function (oEvent) {
                // Get the selected item from the ComboBox
                var oSelectedItem = oEvent.getParameter('selectedItem');

                // Check if an item is selected
                if (oSelectedItem) {
                    // Set the selected value into the input field
                    var sTimeRange = oSelectedItem.getText();

                    // Split the time range into start and end times
                    var aTimes = sTimeRange.split(' - ');
                    var sStartTime = aTimes[0].trim(); // "9:00:00 AM"
                    var sEndTime = aTimes[1].trim(); // "9:30:00 PM"

                    // Format the times to remove the seconds (if necessary)
                    var oStartTime = formatter._formatTime(sStartTime);
                    var oEndTime = formatter._formatTime(sEndTime);

                    // Set the formatted times into the TimePicker fields
                    this.byId('startTime').setValue(oStartTime);
                    this.byId('endTime').setValue(oEndTime);
                }
                this.getMeetingDate();
            },

            getAvailableUsers: async function () {
                let userAvailabledata = [];
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel('UserAvailableModel').getData();
                srcObject.UserAssign.forEach(function (item) {
                    item.MeetingStartDate = formatter.convertToISOFormat(item.MeetingStartDate);
                    item.MeetingEndDate = formatter.convertToISOFormat(item.MeetingEndDate);
                    item.UserAvailable = null;
                });
                if (srcObject.UserAssign[0].MeetingStartDate == '' && srcObject.UserAssign[0].MeetingEndDate == '') {
                    MessageToast.show('Plase Select Date, Start Time & End Time');
                    return;
                }
                this.transferObjectValues(srcObject, trgObject);
                console.log('requestObject', trgObject);
                await this.createNewModelUsingAPI(
                    'POST',
                    '/odata/v4/stoneman-crf/PDDRRA_Check_UserAvailability',
                    trgObject,
                    'UserResModel'
                );
                let myModel = this.getView().getModel('UserResModel');
                let datamodel = myModel.getData();
                console.log(datamodel);
                datamodel.value.forEach(function (item) {
                    userAvailabledata.push(item.UserAvailable);
                });
                // Step 2: Set the 'UserAvailable' data into the correct path in the view model
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aTableData = oViewModel.getProperty('/UserAssign');

                if (aTableData && aTableData.length > 0) {
                    aTableData.forEach(function (item, index) {
                        item.UserAvailable = userAvailabledata[index];
                    });
                    oViewModel.setProperty('/UserAssign/UserAvailable', aTableData.UserAvailable);
                }
                this.getMeetingDate();
            },

            findDuplicateEntries: function (arr) {
                var seen = {}; // To track unique combinations of MCatCode and MCatName
                var duplicates = []; // To store duplicates

                arr.forEach(function (item) {
                    var userId = item.UserID_UserID;

                    // Check if the UserID has already been seen
                    if (seen[userId]) {
                        duplicates.push(item); // If yes, this is a duplicate
                    } else {
                        seen[userId] = true; // Otherwise, mark it as seen
                    }
                });
                return duplicates;
            },

            onRouterClicknewprint: function (oEvent) {
                var sHref = './modone/view/NewPrint.html?name=' + encodeURIComponent(this.getListViewEditPropertyValue());
                //window.location.href = sHref;
                window.open(sHref, '_blank');
            },

            
            enableDisableViewBtn : function (data) {
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


            }


        });
    },

);
