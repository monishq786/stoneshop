
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
        'stoneman/modone/constants/Constant',
        "sap/m/library",
        "sap/ui/core/library",
        "sap/m/Button"],
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
        Constant,
        mobileLibrary,
        coreLibrary,
        Button,
    ) {
        'use strict';
        let irowIndex;
        let oSelectDiamension;
        let oSelectDiameter;
        let fileName = '';
        let _oSelectedRowContext;
        let _iRowIndex;
        let _oInputField;
        let AttachmentData = [];
        let AttachmentDataSingle = [];
        let enableDisableArray = [];
        let buyerCode;
        let sstageCode;
        let RoleInfo;
        let LoginInfo;
        let formMode;
        let aTimeSlots = [];
        let isValidateMaterial = false;
        let iRowAttachmentIndex;
        let sId;
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
        let saveorsubmit;
        let buyerGUID;
        let _aBase64FilesMultiple = [];
        let _aBase64FileSingle = [];
        let aSelectedRows = [];
        let editResponse;
        //  let enumAttachmnetData = [];
        var DialogType = mobileLibrary.DialogType;
        var ValueState = coreLibrary.ValueState;
        var ButtonType = mobileLibrary.ButtonType;
        let isGetUseravailabilityClicked = false;
        return genericentryform.extend('modonecontroller.crfentryform', {
            constructor: function () {
                this.irowIndex = 0;
            },

            onInit: async function () {
                genericentryform.prototype.onInit.apply(this, arguments);
            },

            onBeforeShow: async function (oEvent) {
                this.identifyFormMode(oEvent);
                this.initialize();
                this.setEntryFormDataSourceURLForEditMode(
                    '/odata/v4/stoneman-crf/TCrfHeader(' +
                    this.getListViewEditPropertyValue() +
                    ')?$expand=ProductSubCat,Team($expand=User($expand=Role)),MainAttachment($expand=Attachment),Stage($filter=DelMark%20eq%200),CreatedByUserID,InspDraw($expand=User($expand=Role),Attachment%20$filter=DelMark%20eq%200),UserAssign($expand=UserID,Parent$filter=DelMark%20eq%200),SeekAdvice($expand=QuestionToUser,Attachment,Role,QuestionFromUser$filter=DelMark%20eq%200),Material($filter=DelMark%20eq%200),ApprovalTransaction($expand=DataFlow($expand=User($filter=DelMark%20eq%200))$orderby=RowNumber%20asc),Brand&$filter=DelMark%20eq%200'
                );

                await this.showEntryForm();

                //PDRM Meeting Date
                this.disablePastDateForPDRMMeetings();

                //PDDate
                this.disableFutureDatesForPDDate();

                if (formMode === '2') {
                    await this.getEditData();
                    await this.getTeamUser();


                    this.setProcessHistoryDisplayDataFormat();
                } else {
                    let main = { 'node': [] }
                    var oModel = new JSONModel(main);
                    this.getView().setModel(oModel, 'testdata');
                }


            },

            disablePastDateForPDRMMeetings: function () {
                const oModelPDRMDate = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModelPDRMDate.getData();
                // update login user 
                let oLoginInfo = this.getLoginInfo();
                oData.loginUserID_UserGuid = oLoginInfo.UserID
                const today = new Date();
                oData.minDate = today;
                oModelPDRMDate.setData(oData);
                this.getView().setModel(oModelPDRMDate, this.getEntryFormDataSourceModelName());
            },

            disableFutureDatesForPDDate: function () {
                const oModelPDDate = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModelPDDate.getData();
                const today = new Date();
                oData.maxDate = today;
                oModelPDDate.setData(oData);
                this.getView().setModel(oModelPDDate, this.getEntryFormDataSourceModelName());
            },

            setProcessHistoryDisplayDataFormat: function () {
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let data = oViewModel.getData();
                let filteredData = data.ApprovalTransaction.filter(function (item) {
                    return item.RowNumber !== 0;
                });
                let node = [];
                filteredData.forEach(element => {
                    let innerArr = [];
                    element.DataFlow.forEach(ele => {
                        let innerDict = {
                            name: ele.User.UserName,
                            role: ele.User.UserRoleCode,
                            startdate: ele.StartDate == null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(ele.StartDate),
                            enddate: ele.EndDate == null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(ele.EndDate),
                            comment: ele.Remarks,
                            taskstatus: ele.ApprovalStatus == 'NA' ? null : ele.ApprovalStatus,
                            completionstatus: element.RowStatus,
                            nature: element.Type
                        }
                        innerArr.push(innerDict);
                    });
                    let dict = {
                        rowNumber: element.RowNumber,
                        name: element.StageCode,
                        role: null,
                        startdate: element.startDte,
                        enddate: element.endDte,
                        comment: element.Remarks,
                        taskstatus: element.ApprovalStatus == 'NA' ? null : element.ApprovalStatus,
                        completionstatus: element.RowStatus,
                        nature: element.Type,
                        node: innerArr
                    }
                    node.push(dict);
                });
                let main = { 'node': node }

                var oModel = new JSONModel(main);
                this.getView().setModel(oModel, 'testdata');
            },

            onCheckDiamension: function (oEvent) {
                oSelectDiamension = oEvent.getParameter('selected');
                let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oViewModel.setProperty('/isDimension', oSelectDiamension);
            },


            // onCheckDiameter: function (oEvent) {
            //     oSelectDiameter = oEvent.getParameter('selected');
            //     let oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
            //     oViewModel.setProperty('/isDiamter', oSelectDiameter);
            // },

            initialize: async function () {
                RoleInfo = this.getRoleDetails();
                LoginInfo = this.getLoginInfo();
                formMode = this.getFormMode();
                this.setPageId('cadreqef');
                this.setFormTitle('CAD Entry Form');

                this.setBackwardRoute('RouteCRFListView');

                this.setEntryFormDataSourceURLForNewMode('');

                this.setEntryFormDataSourceURLToAddData('/odata/v4/stoneman-crf/TCrfHeader');
                this.setEntryFormDataSourceURLToUpdateData(
                    '/odata/v4/stoneman-crf/TCrfHeader(' + this.getListViewEditPropertyValue() + ')'
                );

                this.setListViewFilterColumn('cadreqlvInpCrfTech', 'Tech', 'Cfl', 'eq', 'String', 'DepartmentName', 'cflForTech');

                let oPathSaveReq = jQuery.sap.getModulePath(
                    'stoneman',
                    '/modone/model/CRFSaveRequest.json' //Save Request Model
                );
                let oModelSaveRequest = new sap.ui.model.json.JSONModel(oPathSaveReq);
                this.getView().setModel(oModelSaveRequest, 'CRFSaveRequestModel');

                let oPathTimeSlot = jQuery.sap.getModulePath('stoneman', '/modone/model/timeSlot.json');
                let oModelTimeSlot = new sap.ui.model.json.JSONModel(oPathTimeSlot);
                this.getView().setModel(oModelTimeSlot, 'TimeSlotModel');

                let oPathUserAvailability = jQuery.sap.getModulePath('stoneman', '/modone/model/UserAvailability.json');
                let oModelUserAvailable = new sap.ui.model.json.JSONModel(oPathUserAvailability);
                this.getView().setModel(oModelUserAvailable, 'UserAvailableModel');

                let oPathSeekAdvice = jQuery.sap.getModulePath('stoneman', '/modone/model/SeekAdviceSaveRequest.json');
                let oModelSeekAdvice = new sap.ui.model.json.JSONModel(oPathSeekAdvice);
                this.getView().setModel(oModelSeekAdvice, 'SeekAdviceModel');

                let oPathAttachment = jQuery.sap.getModulePath('stoneman', '/modone/model/Attachment.json');
                let oModelAttachment = new sap.ui.model.json.JSONModel(oPathAttachment);
                this.getView().setModel(oModelAttachment, 'AttachModel');

                let oPathMainProductImage = jQuery.sap.getModulePath('stoneman', '/modone/model/MainProductImage.json');
                let oModelMainProductImage = new sap.ui.model.json.JSONModel(oPathMainProductImage);
                this.getView().setModel(oModelMainProductImage, 'MainProductImageModel');

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

                    inputTypeArray: [
                        {
                            id: 'I',
                            name: 'Internal'
                        },
                        {
                            id: 'E',
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
                    ],

                    Brand: [
                        {
                            BuyerBrandGuid: '',
                            BrandName: ''
                        }
                    ],
                    CadLevel: [
                        {

                            EnumCode: '',
                            EnumDescription: ''

                        }
                    ],
                    LightHolder: [
                        {

                            EnumCode: '',
                            EnumDescription: ''

                        }
                    ],
                    LightCord: [
                        {

                            EnumCode: '',
                            EnumDescription: ''

                        }
                    ],
                    LightShape: [
                        {

                            EnumCode: '',
                            EnumDescription: ''

                        }
                    ],

                };

                this.createNewModelUsingArray('ReqTypeModel', sampleData);
                this.myName = LoginInfo['Username'];
                let oViewModel = new JSONModel({ myName: this.myName });

                this.getView().setModel(oViewModel, 'view');

                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/MEnum?$filter=EnumType eq 'LIGHTING_SUB_CAT'`,
                    '',
                    'modelSubCatName'
                );

                this._aBase64FilesMultiple = [];
                this._aBase64FileSingle = [];
                this.AttachmentData = [];
                this._savedQueryValue = '';
                this._oSelectedRowContext = null;

                if (formMode == '3') {

                    // Set the date to the model in the required format (yyyy-MM-dd)
                    let oPath = jQuery.sap.getModulePath(
                        'stoneman',
                        '/modone/model/CRFEntryResponse.json'
                    );

                    let oModel = new sap.ui.model.json.JSONModel(oPath);
                    await this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());

                    await this.addScreenFunctaionality();
                    await this.onEnableDisableChange();
                    //await this.getTemplateDataForEnableDisable();
                    await this.onSelectLightning();
                    await this.getAttachemntRefrenceType();
                    //await this.onCategoryChange();

                }

                if (formMode == '2') {
                    const oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.subscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);

                    let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    buyerCode = oModel.getProperty('/BuyerCode');

                    await this.editScreenFunctionality();
                    await this.getCadLevelData();
                    await this.getAttachemntRefrenceType();
                    await this.onCategoryChange();
                    //await this.ValidateAttachmentTable();
                    setTimeout(() => {
                        this.subscribeFragment();
                    }, 100);


                }

                let oObjectPageLayout = this.byId('HeaderObject');
                let oSection = this.byId('HeaderSelect');
                oObjectPageLayout.setSelectedSection(oSection);

                //Table Scrolling 
                const aScrollContainerIds = ['scrollDiamension', 'scrollTeam', 'scrollAttachment', 'scrollPDDRA', 'scrollCRFSeekAdvice', 'CRFProgressScroll'];
                aScrollContainerIds.forEach(id => {
                    const oScrollContainer = this.getView().byId(id); // Get the ScrollContainer by ID
                    if (oScrollContainer) {
                        const oDomRef = oScrollContainer.getDomRef(); // Get the DOM reference of the container
                        if (oDomRef) {
                            // Apply min and max height dynamically to each container
                            oDomRef.style.minHeight = 'auto';
                            oDomRef.style.maxHeight = '200px';
                            oDomRef.style.overflow = 'auto'; // Ensure scrolling
                        }
                    }
                });

            },

            onDateChange: function (oEvent) {
                let sSelectedDate = oEvent.getParameter("value"); // Get the selected value
                let oDatePicker = oEvent.getSource();
                let today = new Date();
                let selectedDate = new Date(sSelectedDate);
                // Reset the time to 00:00:00 for both dates
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
                // Check if the selected date is in the future
                if (selectedDate > today) {
                    MessageToast.show("Future Date is not allowed.");
                    oDatePicker.setValue("");
                }
            },

            getEditData: async function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let aData = oModel.getData();
                const oTable = this.getView().byId("cadTable");
                const aItems = oTable.getItems();
                if (aData.CrfStatus === 'HOLD') {
                    this.byId("btnHold").setText("Resume");
                } else {
                    this.byId("btnHold").setText("Hold");
                }

                this.checkForProdCategoryForLighting(aData.ProductCatName);

                // aItems.forEach((oItem) => {
                //     const oAttachFileButton = oItem.getCells().find((cell) => cell.getId().includes("attachFile"));
                //     if (oAttachFileButton && aData != null) {
                //         oAttachFileButton.setEnabled(true);
                //     }
                // });
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
                aData.Team.forEach(function (item, index = 0) {
                    item.RowNumber = index + 1;
                });
                if (!Array.isArray(this.aSelectedRows)) {
                    this.aSelectedRows = [];
                }
                this.aSelectedRows.push(...aData.Team);
                aData.SeekAdvice.forEach(function (element) {
                    element.isNewRow = false;
                    element.isDownloadVisibleSeek = true;
                });
                aData.ApprovalTransaction.forEach(function (item, index = 0) {
                    //item.processDte = item.ProcessDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.ProcessDate);
                    item.startDte = item.ActiveStartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.ActiveStartDate);
                    item.endDte = item.ActiveEndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.ActiveEndDate);
                    item.RowNumber = item.RowNumber;
                });

                aData.UserAssign.forEach(function (item, index = 0) {
                    item.MeetingStartDate =
                        item.MeetingStartDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingStartDate);
                    item.MeetingEndDate =
                        item.MeetingEndDate === null ? null : formatter.getDateFromatIn_ddMMyyyy_HHmm(item.MeetingEndDate);
                    item.RowNumber = index + 1;
                });
                let oView = this.getView();
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD
                ) {
                    if (aData.CrfStageCode === 'CRF_BUYER_APPROVAL_PENDING') {

                        oView.byId('btnApprove').setVisible(true);
                        oView.byId('btnReject').setVisible(true);
                        oView.byId('btnSave').setVisible(false);
                        // oView.byId('btnHold').setVisible(false);
                        oView.byId('btnSubmit').setVisible(false);
                        oView.byId('btnPrint').setVisible(false);
                    }
                }

                if (formMode === '3') {//add
                    oView.byId('btnHold').setVisible(false);
                } else {
                    if (LoginInfo.UserID === aData.CreatedByUserID_UserGuid && (aData.CrfStatus === 'HOLD' || aData.CrfStatus === 'WIP')) {
                        let oView = this.getView();
                        oView.byId('btnHold').setVisible(true);
                    } else {
                        oView.byId('btnHold').setVisible(false);
                    }
                }

                this.byId('meetingDte').setValue(null);
                this.byId('startTime').setValue(null);
                this.byId('endTime').setValue(null);
                this.byId('timeSlotCombo').setValue(null);
                if (aData.ReqTyp === 'R') {
                    this.byId('oldCadReq').setVisible(true);
                    // this.byId('crfNo').setVisible(true);
                    this.byId('ecnNo').setVisible(true);
                    this.byId('carNo').setVisible(true);
                    this.byId('cadDetailNo').setVisible(true);

                }
                else {
                    this.byId('oldCadReq').setVisible(false);
                    this.byId('crfNo').setVisible(false);
                    this.byId('ecnNo').setVisible(false);
                    this.byId('carNo').setVisible(false);
                    this.byId('cadDetailNo').setVisible(false);

                }

                this.getAllExpendData(aData);
                //this.showHideViewBtn(aData);
                this.getEnableDisableAPIFun(aData.Stage_StageGuid);
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                    this.onGenerateTimeSlots();
                }

                await this.enableDisableViewBtn(aData);
                await this.onSelectLightning();
                //await this.onSetRoleName(RoleInfo, oModel);
                oModel.setData(aData);
                this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());

                //get exchnage rate
                this.getExchangeRate();
            },

            onSetRoleName: async function (RoleInfo, aMainData) {
                console.log(aMainData);
                let aItems = aMainData.getProperty("/InspDraw");
                aItems.forEach(function (item) {
                    item.User_UserGuid = LoginInfo.UserID;
                    item.User.Role.Description = RoleInfo.RoleName
                    item.User.UserName = LoginInfo.Username;
                })
                aMainData.setProperty("/InspDraw", aItems);
                this.getView().setModel(aMainData, this.getEntryFormDataSourceModelName());

            },

            editScreenFunctionality: async function () {
                var oView = this.getView();
                sstageCode = this.getView()
                    .getModel(this.getEntryFormDataSourceModelName())
                    .getProperty('/CrfStageCode');
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL
                ) {
                    //login user guid === created by user id
                    //crfstatus == wip 

                    oView.byId('btnSave').setVisible(false);
                    // oView.byId('btnHold').setVisible(false);
                    oView.byId('btnSubmit').setVisible(false);
                    oView.byId('btnPrint').setVisible(false);
                    oView.byId('btnApprove').setVisible(true);
                    oView.byId('btnReject').setVisible(true);
                } else {
                    oView.byId('btnSave').setVisible(true);
                    // oView.byId('btnHold').setVisible(true);
                    oView.byId('btnSubmit').setVisible(true);
                    oView.byId('btnPrint').setVisible(true);
                    oView.byId('btnApprove').setVisible(false);
                    oView.byId('btnReject').setVisible(false);
                }

                if (formMode === '3') {//add
                    oView.byId('btnHold').setVisible(false);
                } else {
                    let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    let aData = oModel.getData();
                    if (LoginInfo.UserID === aData.CreatedByUserID_UserGuid && (aData.CrfStatus === 'HOLD' || aData.CrfStatus === 'WIP')) {
                        let oView = this.getView();
                        oView.byId('btnHold').setVisible(true);
                    } else {
                        oView.byId('btnHold').setVisible(false);
                    }
                }
            },

            addScreenFunctaionality: async function () {
                var oView = this.getView();
                oView.byId('btnSave').setVisible(true);
                oView.byId('btnSubmit').setVisible(true);
                oView.byId('btnHold').setVisible(false);
                oView.byId('btnPrint').setVisible(false);
                oView.byId('btnApprove').setVisible(false);
                oView.byId('btnReject').setVisible(false);
                this.readOnlyInputFun();

            },

            // showHideViewBtn: function (data) {
            //     data.SeekAdvice.forEach(function (item) {
            //         if (item.SeekAdviceDocAbsId_AbsId !== null) {
            //             item.isDownloadVisibleSeek = true;
            //         } else {
            //             item.isDownloadVisibleSeek = false;
            //         }
            //     });
            //     data.InspDraw.forEach(function (item) {
            //         if (item.DraftAttachmentAbsId_AbsId !== null) {
            //             item.isDownloadVisibleDraft = true;
            //         } else {
            //             item.isDownloadVisibleDraft = false;
            //         }
            //         if (item.TechAttachementAbsID_AbsId !== null) {
            //             item.isDownloadVisibleTech = true;
            //         } else {
            //             item.isDownloadVisibleTech = false;
            //         }
            //         if (item.InspRefDocAbsId_AbsId !== null) {
            //             item.isDownloadVisible = true;
            //         } else {
            //             item.isDownloadVisible = false;
            //         }
            //     });

            //     var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
            //     oModel.setData(data);
            //     this.getView().setModel(oModel, this.getEntryFormDataSourceModelName());
            // },

            readOnlyInputFun: function () {
                this.getView().byId('buyer').setValueHelpOnly(true);
                this.getView().byId('matCategory').setValueHelpOnly(true);
                this.getView().byId('oldCadReq').setValueHelpOnly(true);
                this.getView().byId('cadDetailNo').setValueHelpOnly(true);
                this.getView().byId('dUnit').setValueHelpOnly(true);
                this.getView().byId('prodCatType').setValueHelpOnly(true);
                this.getView().byId('subCategory').setValueHelpOnly(true);

            },

            getEnableDisableAPIFun: async function (stageGUID) {

                let editStageGUID = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/Stage_StageGuid');
                var body = {
                    DOCUMENTGUID: this.getFormMode() === '3' ? null : this.getListViewEditPropertyValue(),
                    LOGINGUID: LoginInfo.UserID,
                    ROLEGUID: LoginInfo.RoleGuid,
                    STAGEGUID: this.getFormMode() === '3' ? stageGUID : editStageGUID
                }
                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-crf/DocumentFieldsEnableDisable", body, "enableModel");
                let enableModel = this.getView().getModel("enableModel");
                let datamodel = enableModel.getData();


                if (datamodel) {
                    enableDisableArray = [];
                    if (datamodel.value.length != 0) {
                        enableDisableArray = datamodel.value
                        this.updateControlStates(enableDisableArray);
                    }
                }

            },

            // getAllDisableControls: async function () {
            //     await this.createNewModelUsingAPI(
            //         'GET',
            //         `/odata/v4/stoneman-crf/MCrfControls?$filter=RoleCode eq ${null} and StageCode eq ${null} and FormType eq 'CRF'&$expand=Detail`,
            //         '',
            //         'enableDisableAllValueModel'
            //     );
            //     let oenableDisableModel = this.getView().getModel('enableDisableAllValueModel');
            //     if (oenableDisableModel.oData.value.length != 0) {
            //         this.updateControlStates(oenableDisableModel.oData.value[0].Detail);
            //     }
            // },

            // getAssignProdEnggAPI: async function (buyerCode) {
            //     // var oSelect = this.byId('assignProdEng');
            //     // oSelect.setSelectedKey(''); // This will reset the selected key to blank
            //     await this.createNewModelUsingAPI(
            //         'GET',
            //         `/odata/v4/stoneman-crf/MUser?$expand=Buyer($filter=BuyerCode eq '${buyerCode}')&$filter=UserRoleCode_RoleCode_RoleConstant eq 'PRODUCT_ENGG'`,
            //         '',
            //         'AssgnEnggModel'
            //     );
            //     let oAssgnEnggModel = this.getView().getModel('AssgnEnggModel');
            //     let aData = oAssgnEnggModel.getData();
            //     aData.value.unshift({ UserID: '', Username: 'Please Select' });
            //     aData.value = oAssgnEnggModel.oData.value;
            //     oAssgnEnggModel.setData(aData);
            //     this.getView().setModel(oAssgnEnggModel, 'AssgnEnggModel');
            // },

            // onSelectAssnProdEng: function (oEvent) {
            //     let oSelectedItem = oEvent.getSource().getSelectedItem();
            //     let sSelectedKey = oEvent.getSource().getSelectedKey();
            //     let sSelectedText = oSelectedItem.getText();
            //     this._sSelectedValue = sSelectedText;
            //     this._sSelectedUserID = sSelectedKey;
            //     this.onAddToTable();
            // },

            // onAddToTable: function () {
            //     let oTableModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
            //     let aTableItems = oTableModel.getProperty('/InspDraw');
            //     aTableItems.forEach(
            //         function (item) {
            //             item.AssignProd = this._sSelectedValue;
            //             item.DraftUserID_UserID = this._sSelectedUserID;
            //         }.bind(this)
            //     );
            //     oTableModel.refresh();
            // },

            // populateItemGroupDropDown: async function () {
            //     await this.createNewModelUsingAPI('GET', '/sap/opu/odata4/sap/api_productgroup_2/srvd_a2x/sap/productgroup/0001/ProductGroup', '', 'reqModel');
            //     this.populateSelect('itemGroup', 'reqModel', 'value', 'Product', 'ProductGroup');
            // },

            getAllExpendData: function (aData) {
                let oModelExpend = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oDataExpend = oModelExpend.getData();
                oDataExpend.appliDiamter = aData.appliDiamter === 'Y' ? true : false;
                oDataExpend.appliDimension = aData.appliDimension === 'Y' ? true : false;
                oModelExpend.setProperty('/isDiamter', oDataExpend.appliDiamter);
                oModelExpend.setProperty('/isDimension', oDataExpend.appliDimension);
                oModelExpend.setProperty('/CrfStageCode', aData.CrfStageCode);

                oDataExpend.UserAssign.forEach(function (item) {
                    if (item.UserID != null) {
                        item.UserName = item.UserName;
                    }
                });
                oDataExpend.SeekAdvice.forEach(function (item) {
                    if (item.Role != null) {
                        item.QuestionToUserName = item.QuestionToUserName;
                        item.RoleName = item.Role.Description;
                    }
                });
                oDataExpend.InspDraw.forEach(function (item) {
                    if (item.User != null) {
                        item.UserName = item.User.UserName;
                        item.RoleName = item.User.Role.Description;

                    }
                });
                oModelExpend.setData(oDataExpend);
                this.getView().setModel(oModelExpend, this.getEntryFormDataSourceModelName());
            },

            cflForBuyer: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_BPCUST_WITH_CURR_CDS/YY1_BPCust_with_CURR',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Buyer List');
                this.setCflDisplayColumns(['BusinessPartner', 'Customer', 'Supplier', 'BusinessPartnerName']);
                this.setCflDataColumns(['BusinessPartner', 'Customer', 'Supplier', 'BusinessPartnerName']);
                this.setCflValueAndDisplay('/BuyerName', 'BusinessPartnerName', '', '');
                this.setCflSearchProperty('BusinessPartnerName');
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/YY1_BPCUST_WITH_CURR_CDS/");
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata/sap/YY1_BPCUST_WITH_CURR_CDS/YY1_BPCust_with_CURR`, "", "d/results");

                this.showCfl('buyer', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForBuyer.bind(this));
            },

            onClosecflForBuyer: function () {
                let oBuyerRes = this.getCflObject();
                let oBuyerSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oBuyerSetData.setProperty('/BuyerCode', oBuyerRes.BusinessPartner);
                oBuyerSetData.setProperty('/BuyerGuid', oBuyerRes.BusinessPartnerUUID);
                oBuyerSetData.setProperty('/BuyerCur', oBuyerRes.Currency);
                oBuyerSetData.setProperty('/EstCostInINR', 0);
                oBuyerSetData.setProperty('/EstCostInDocCur', 0);
                this.buyerGUID = oBuyerRes.BusinessPartnerUUID;
                this.getBuyerBrandData(this.buyerGUID);
                this.getExchangeRate();
                this.getTeamUser();
                oBuyerSetData.setProperty('/Team', []);
            },

            cflForCategory: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    `/sap/opu/odata/sap/ZUI_MAT_GRP_DT_API/ZC_MAT_GRP_DT?$filter=MatGroup ne '-1'`,
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Category List');
                this.setCflDisplayColumns(['Material Category Code', 'Material Category Name']);
                this.setCflDataColumns(['MatGroup', 'MatGroupName']);
                this.setCflValueAndDisplay('/MCatName', 'MatGroupName', '', '');
                this.setCflSearchProperty('MatGroupName');
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/ZUI_MAT_GRP_DT_API/");
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata/sap/ZUI_MAT_GRP_DT_API/ZC_MAT_GRP_DT?$filter=MatGroup ne '-1'`, "", "d/results");
                this.showCfl('matCategory', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForCategory.bind(this));

            },

            onClosecflForCategory: function () {
                let oCategoryRes = this.getCflObject();
                let oCategorySetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oCategorySetData.setProperty('/MCatCode', oCategoryRes.MatGroup);
                this.setMaterialName(oCategorySetData);
                this.getTeamUser();
                oCategorySetData.setProperty('/Team', []);
                oCategorySetData.setProperty('/SubCatName', null);

            },

            cflForCountry: async function () {
                //old - '/sap/opu/odata/sap/YY1_COUNTRY_CDS/YY1_COUNTRY'
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/MEnum?$filter=EnumType eq 'LIGHTING_COUNTRY'`,
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Country List');
                this.setCflDisplayColumns(['Country Code', 'Country Name']);
                this.setCflDataColumns(['EnumCode', 'EnumDescription']);
                this.setCflValueAndDisplay('/CountryDescription', 'EnumDescription', '', '');
                this.setCflSearchProperty('EnumDescription');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", `/odata/v4/stoneman-crf/MEnum?$filter=EnumType eq 'LIGHTING_COUNTRY'`, "", "value");

                this.showCfl('lightingCountry', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflForCountry.bind(this));

            },

            onClosecflForCountry: function () {
                let oCountryRes = this.getCflObject();
                let oCountrySetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oCountrySetData.setProperty('/CountryCode', oCountryRes.EnumCode);

                //clear holder lighting data in case of country chnaged
                let entryFormModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let entryFormData = entryFormModel.getData();
                let SubProductFields = this.getView().getModel('SubProductFieldsModel').getData();
                SubProductFields.value.forEach(element => {
                    if (element.Country == true) {
                        let ProductSubCat = entryFormData['ProductSubCat'];
                        if (ProductSubCat.length > 0) {
                            // Find index of the object to remove
                            var index = ProductSubCat.findIndex(item => item.Value === element.Value);
                            if (index !== -1) {
                                ProductSubCat.splice(index, 1); // Remove 1 item at found index
                                if (element.Value === entryFormData.HolderName) {
                                    entryFormModel.setProperty('/HolderName', null);
                                } else if (element.Value === entryFormData.ShapeName) {
                                    entryFormModel.setProperty('/ShapeName', null);
                                } else if (element.Value === entryFormData.CordName) {
                                    entryFormModel.setProperty('/CordName', null);
                                }
                            }
                        }
                    }
                });
            },

            cflForSubCategory: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_EXTMATERIALGROUP_CDS/YY1_ExtMaterialGroup',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Sub Category List');
                this.setCflDisplayColumns(['Material Sub Category Code', 'Material Sub Category Name']);
                this.setCflDataColumns(['ExternalProductGroup', 'ExternalProductGroupName']);
                this.setCflValueAndDisplay('/SubCatName', 'ExternalProductGroupName', '', '');
                this.setCflSearchProperty('ExternalProductGroupName');
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/YY1_EXTMATERIALGROUP_CDS/");
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata/sap/YY1_EXTMATERIALGROUP_CDS/YY1_ExtMaterialGroup`, "", "d/results");

                this.showCfl('subCategory', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForSubCategory.bind(this));

            },

            onClosecflForSubCategory: function () {
                let oSubCategory = this.getCflObject();
                let oSubCategorySetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oSubCategorySetData.setProperty('/SubCatCode', oSubCategory.ExternalProductGroup);
            },

            cflForProdCat: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    "/odata/v4/stoneman-crf/MProductCategory?$filter=DelMark eq 0 and IsActive eq 'Y'",
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Product Category List');
                this.setCflDisplayColumns(['Product Code', 'Product Name']);
                this.setCflDataColumns(['ProductCategoryCode', 'ProductCategoryName']);
                this.setCflValueAndDisplay('/ProductCatName', 'ProductCategoryName', '', '');
                this.setCflSearchProperty('ProductCatName');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", `/odata/v4/stoneman-crf/MProductCategory?$filter=DelMark eq 0 and IsActive eq 'Y'`, "", "value");

                this.showCfl('prodCatType', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflForProdCat.bind(this));

            },

            onClosecflForProdCat: function () {
                let oProdCatRes = this.getCflObject();
                let oProdCatSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oProdCatSetData.setProperty('/ProductCatCode', oProdCatRes.ProductCategoryCode);
                oProdCatSetData.setProperty('/ProductCatGuid_ProductCategoryGuid', oProdCatRes.ProductCategoryGuid);
                this.onSelectLightning();
                this.setMaterialName(oProdCatSetData);
                this.onSelectProdCatAndMatCat();
                this.getTeamUser();
                oProdCatSetData.setProperty('/Team', []);

                //on chnage of prod category
                oProdCatSetData.setProperty('/HolderName', null);
                oProdCatSetData.setProperty('/ShapeName', null);
                oProdCatSetData.setProperty('/CordName', null);
                oProdCatSetData.setProperty('/CountryDescription', null);
                this.checkForProdCategoryForLighting(oProdCatRes.ProductCategoryName);

                // if (oProdCatRes.ProductCategoryName === "Lighting") {
                //     this.getSubProductField();
                // } else {
                //     let oProdCatSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                //     oProdCatSetData.setProperty('/IsHolderVisible', false);
                //     oProdCatSetData.setProperty('/IsCodeVisible', false);
                //     oProdCatSetData.setProperty('/IsShapeVisible', false);
                //     oProdCatSetData.setProperty('/LabelHolder', null);
                //     oProdCatSetData.setProperty('/LabelCord', null);
                //     oProdCatSetData.setProperty('/LabelShape', null);
                // }
            },

            checkForProdCategoryForLighting: async function (oProdCatName) {
                const prodCatList = await this.getProductCatListForLighting()
                if (prodCatList.includes(oProdCatName)) {
                    this.getSubProductField();
                } else {
                    let oProdCatSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    oProdCatSetData.setProperty('/IsHolderVisible', false);
                    oProdCatSetData.setProperty('/IsCodeVisible', false);
                    oProdCatSetData.setProperty('/IsShapeVisible', false);
                    oProdCatSetData.setProperty('/LabelHolder', null);
                    oProdCatSetData.setProperty('/LabelCord', null);
                    oProdCatSetData.setProperty('/LabelShape', null);
                }
            },
            getProductCatListForLighting: async function () {
                // let SubProduct = this.getView().getModel('modelSubCatName').getData();
                // let odata = SubProduct.getData();
                let oModel = this.getView().getModel('modelSubCatName')
                let SubProduct = oModel.getData();
                let productList = SubProduct.value.map(item => item.EnumCode);
                console.log(productList)
                return productList

            },

            getSubProductField: async function () {
                await this.createNewModelUsingAPI(
                    'POST',
                    "/odata/v4/stoneman-crf/getSubProductField",
                    {
                        "ProductCatCode": "Lighting"
                    },
                    'SubProductFieldsModel'
                );
                let SubProductFields = this.getView().getModel('SubProductFieldsModel');
                let oData = SubProductFields.getData();
                let oProdCatSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());

                oData.value.forEach(element => {
                    if (element.Value === 'Holder') {
                        oProdCatSetData.setProperty('/IsHolderVisible', true);
                        oProdCatSetData.setProperty('/LabelHolder', element.Lable);
                    } else if (element.Value === 'Cord') {
                        oProdCatSetData.setProperty('/LabelCord', element.Lable);
                        oProdCatSetData.setProperty('/IsCodeVisible', true);
                    } else if (element.Value === 'Shade') {
                        oProdCatSetData.setProperty('/LabelShape', element.Lable);
                        oProdCatSetData.setProperty('/IsShapeVisible', true);
                    }
                });
            },

            cflForHolder: async function (oEvent) {
                let oSource = oEvent.getSource(); // Get the control that triggered the event
                sId = oSource.getId();
                let label; let modelName;
                let cflTitle;
                if (sId.includes("lightingHolder")) {
                    label = "Holder";
                    modelName = "HolderDataModel";
                    cflTitle = "Holder List";
                } else if (sId.includes("lightingShape")) {
                    label = "Shade";
                    modelName = "ShapeDataModel";
                    cflTitle = "Shade List";
                } else if (sId.includes("lightingCord")) {
                    label = "Cord";
                    modelName = "CordDataModel";
                    cflTitle = "Cord List";
                }
                let SubProductFields = this.getView().getModel('SubProductFieldsModel').getData();
                let filteredDetailData = SubProductFields.value.filter((ele) => {
                    return ele.Value === label;
                });
                let entryFormData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let countryCode = entryFormData.CountryCode;

                if (filteredDetailData[0].Country === true && (countryCode === undefined || countryCode === null)) {
                    MessageToast.show("Please select Country.");
                } else {
                    if (filteredDetailData[0].Country === true) {//country mandatory
                        await this.createNewModelUsingAPI(
                            'GET',
                            `/odata/v4/stoneman-crf/MProductSubCat?$filter=EnumType eq 'Lighting' and IsActive eq 'Y' and TypeCode eq '${filteredDetailData[0].Value}' and CountryCode eq '${countryCode}'`,
                            '',
                            modelName
                        );
                        this.setCflListViewDataSourceProperties("GET", `/odata/v4/stoneman-crf/MProductSubCat?$filter=EnumType eq 'Lighting' and IsActive eq 'Y' and TypeCode eq '${filteredDetailData[0].Value}' and CountryCode eq '${countryCode}'`, "", "value");

                    } else {
                        await this.createNewModelUsingAPI(
                            'GET',
                            `/odata/v4/stoneman-crf/MProductSubCat?$filter=EnumType eq 'Lighting' and IsActive eq 'Y' and TypeCode eq '${filteredDetailData[0].Value}'`,
                            '',
                            modelName
                        );
                        this.setCflListViewDataSourceProperties("GET", `/odata/v4/stoneman-crf/MProductSubCat?$filter=EnumType eq 'Lighting' and IsActive eq 'Y' and TypeCode eq '${filteredDetailData[0].Value}'`, "", "value");

                    }

                    this.setCflTitle(cflTitle);
                    this.setCflDisplayColumns(['Name', 'Description', 'Type']);
                    this.setCflDataColumns(['Name', 'Description', 'TypeDesc']);

                    this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");

                    if (sId.includes("lightingHolder")) {//Holder
                        this.setCflValueAndDisplay('/HolderName', 'Name', '', '');
                        this.setCflSearchProperty('Name');
                        this.showCfl('lightingHolder', 'HolderDataModel', 'value', this.onConfirmforHolder.bind(this),
                            this.onCancelforHolder.bind(this));
                    } else if (sId.includes("lightingShape")) {//Shape
                        this.setCflValueAndDisplay('/ShapeName', 'Name', '', '');
                        this.setCflSearchProperty('Name');
                        this.showCfl('lightingShape', 'ShapeDataModel', 'value', this.onConfirmforHolder.bind(this),
                            this.onCancelforHolder.bind(this));
                    } else if (sId.includes("lightingCord")) {//Cord
                        this.setCflValueAndDisplay('/CordName', 'Name', '', '');
                        this.setCflSearchProperty('Name');
                        this.showCfl('lightingCord', 'CordDataModel', 'value', this.onConfirmforHolder.bind(this),
                            this.onCancelforHolder.bind(this));
                    }
                }
            },

            onConfirmforHolder: function () {
                let x = this.getCflObject();
                let entryFormData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let SubProductFields = this.getView().getModel('SubProductFieldsModel').getData();

                var lableFilter = SubProductFields.value.filter(item => item.Lable === x.TypeCode);
                let ProductSubCat = entryFormData.getProperty('/ProductSubCat');
                let filterData = ProductSubCat.filter(item => item.Code === x.TypeCode);

                if (filterData.length === 0) {
                    ProductSubCat.push({
                        "Lable": lableFilter.length > 0 ? lableFilter[0].Lable : null,
                        "Type": x.EnumType,
                        "Value": x.TypeDesc,
                        "Code": x.TypeCode,
                        "Description": x.TypeDesc
                    });
                } else {
                    let newObject = {
                        "Lable": lableFilter.length > 0 ? lableFilter[0].Lable : null,
                        "Type": x.EnumType,
                        "Value": x.TypeDesc,
                        "Code": x.TypeCode,
                        "Description": x.TypeDesc
                    }
                    var index = ProductSubCat.findIndex(item => item.Code === newObject.Code);
                    if (index !== -1) {
                        // Replace the existing object
                        ProductSubCat[index] = newObject;
                    } else {
                        console.log("Object not found");
                    }
                }
            },

            onCancelforHolder: function () { },

            cflForUoM: async function () {
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure',
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('UoM List');
                this.setCflDisplayColumns(['Unit of Measure', 'Unit of Measure Name']);
                this.setCflDataColumns(['UnitOfMeasure', 'UnitOfMeasureLongName']);
                this.setCflValueAndDisplay('/UnitCode', 'UnitOfMeasure', '', '');
                this.setCflSearchProperty('UnitOfMeasureLongName');
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/");
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata/sap/YY1_UNITOFMEASURE_CDS/YY1_UnitOfMeasure`, "", "d/results");

                this.showCfl('dUnit', this.getCflListViewDataSourceModelName(), 'd/results', this.onClosecflForUoM.bind(this));
            },

            onClosecflForUoM: function () {
                let oUoMRes = this.getCflObject();
                let oUoMResSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oUoMResSetData.setProperty('/UnitName', oUoMRes.UnitOfMeasureLongName);
                oUoMResSetData.setProperty('/UnitCode', oUoMRes.UnitOfMeasure);


            },

            cflForMaterialCategory: async function (oEvent) {
                var oSource = oEvent.getSource();
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/YY1_ExtProdGrp',//?$top=1000
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Material Category List');
                this.setCflDisplayColumns(['Material Code', 'Material Name']);
                this.setCflDataColumns(['ExternalProductGroup', 'ExternalProductGroupName']);
                this.setCflValueAndDisplay(`/Buyer/${irowIndex}/MCatCode`, 'ExternalProductGroup', '', '');
                this.setCflSearchProperty('ExternalProductGroupName');
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/");
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata/sap/YY1_EXTPRODGRP_CDS/YY1_ExtProdGrp`, "", "d/results");

                this.showCfl(
                    'categoryCode',
                    this.getCflListViewDataSourceModelName(),
                    'd/results',
                    this.onConfirmforMaterial.bind(this),
                    this.onCancelforMaterial.bind(this)
                );
            },

            onConfirmforMaterial: function () {
                let matCatResponse = this.getCflObject();
                let matCatResData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                matCatResData.setProperty(`/Material/${irowIndex}/MaterialCatHanaText`, matCatResponse.ExternalProductGroupName);
                this.onCheckMaterialCatType(matCatResponse.ExternalProductGroup);
            },

            onCancelforMaterial: function () { },

            cflForDeptPddra: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                await this.createNewModelUsingAPI(
                    'GET',
                    '/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2',//?$top=1000
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Department List');
                this.setCflDisplayColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflDataColumns(['CostCenter', 'CostCenterName', 'CostCenterDescription']);
                this.setCflValueAndDisplay(`/UserAssign/${rowIndex}/DepartmentCode`, 'CostCenter', '', '');
                this.setCflSearchProperty('CostCenterName');
                this.setCflBaseUrlForPagination('/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/');
                this.setCflListViewDataSourceProperties("GET", `/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2`, "", "value");

                this.showCfl(
                    'departmentMeeting',
                    this.getCflListViewDataSourceModelName(),
                    'value',
                    this.onConfirmforDeptPddra.bind(this),
                    this.onCancelforDeptPddra.bind(this)
                );
            },

            onConfirmforDeptPddra: function () {
                let deptRes = this.getCflObject();
                let deptResData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                deptResData.setProperty(`/UserAssign/${irowIndex}/DepartmentName`, deptRes.CostCenterName);
            },
            onCancelforDeptPddra: function () { },

            cflForUserPddra: async function (oEvent) {
                var oSource = oEvent.getSource();

                // Get the binding context of the source control to access the row index
                var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());

                // Retrieve the row index from the context
                var rowIndex = oContext.getPath().split('/').pop();
                irowIndex = rowIndex;
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let costcenter = y.getProperty(`/UserAssign/${rowIndex}/DepartmentCode`);
                await this.createNewModelUsingAPI(
                    'GET',
                    '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=Role",
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflTitle('Department List');
                this.setCflDisplayColumns(['UserName', 'UserCode']);
                this.setCflDataColumns(['UserName', 'UserCode']);
                this.setCflValueAndDisplay(`/UserAssign/${rowIndex}/UserName`, 'UserName', '', '');
                this.setCflSearchProperty('UserName');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=Role", "", "value");

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
                this.setCflBaseUrlForPagination('/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/');
                this.setCflListViewDataSourceProperties("GET", '/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2', "", "value");

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
                    '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=Role",
                    '',
                    this.getCflListViewDataSourceModelName()
                );
                this.setCflDisplayColumns(['UserName', 'UserCode']);
                this.setCflDataColumns(['UserName', 'UserCode']);
                this.setCflValueAndDisplay(`/SeekAdvice/${rowIndex}/QuestionToUserName`, 'UserName', '', '');
                this.setCflSearchProperty('UserName');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/MUser' + "?$filter=DepartmentCode eq '" + costcenter + "'&$expand=Role", "", "value");

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
                let sLoginUserGuid = y.getProperty("/loginUserID_UserGuid");
                y.setProperty(`/SeekAdvice/${irowIndex}/QuestionFromUser_UserGuid`, sLoginUserGuid);
                y.setProperty(`/SeekAdvice/${irowIndex}/QuestionToUser_UserGuid`, x.UserGuid);
                y.setProperty(`/SeekAdvice/${irowIndex}/RoleCode`, x.UserRoleCode);
                y.setProperty(`/SeekAdvice/${irowIndex}/RoleName`, x.UserRoleCode);
                y.setProperty(`/SeekAdvice/${irowIndex}/Role_RoleGuid`, x.Role_RoleGuid);
            },

            onCancelforSeekAdvice: function () { },

            onConfirmforPDDRA: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty(`/UserAssign/${irowIndex}/UserID_UserGuid`, x.UserGuid);
                y.setProperty(`/UserAssign/${irowIndex}/UserCode`, x.UserCode);
                y.setProperty(`/UserAssign/${irowIndex}/UserName`, x.UserName);
                y.setProperty(`/UserAssign/${irowIndex}/UserEmailId`, x.EmailId);
                // y.setProperty(`/SeekAdvice/${irowIndex}/RoleCode_RoleCode_RoleConstant`, x.UserRoleCode_RoleCode_RoleConstant);
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
                this.setCflDisplayColumns(['Old CAD Req No.', 'Category Unique Number', 'Product Category Name']);
                this.setCflDataColumns(['CrfReqNo', 'CategoryUniqueNum', 'ProductCatName']);
                this.setCflValueAndDisplay('/OldCrfReqNo', 'CategoryUniqueNum', '', '');
                this.setCflSearchProperty('CrfReqNo');
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCrfHeader', "", "value");

                this.showCfl('oldCadReq', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflOldCadReqNumber.bind(this));
            },

            onClosecflOldCadReqNumber: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                y.setProperty('/CrfReqGuid', x.CrfReqGuid);

                if (y.getProperty('/ReqTyp') === 'R') {
                    y.setProperty('/OldCrfReqNo', x.CrfReqNo);
                    y.setProperty('/OldCrfReqNoGuid_CrfReqGuid', x.CrfReqGuid);
                }
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
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCadDetail' + `?$filter=CrfStatus eq 'CLS'`, "", "value");

                this.showCfl('cadDetailNo', this.getCflListViewDataSourceModelName(), 'value', this.onClosecflCADDetailNumber.bind(this));
            },

            onClosecflCADDetailNumber: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());

                y.setProperty('/CrfReqUUID_CrfReqUUID', x.CrfReqUUID_CrfReqUUID);
                y.setProperty('/OldCADUUID', x.CadDetailUUID);
                this.onChangeCADDetailNo();
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
                    // // Create attachment object

                    // that._aBase64FileSingle[0].AttachmentName = file.name,
                    //     that._aBase64FileSingle[0].OrgFileExtension = file.name.split('.').pop(),
                    //that._aBase64FileSingle[0].fileBase64 = base64, // Base64 encoded string

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
            onUploadPress: async function (oEvent) {
                let oPayload = [];
                let oPayloadSingle = [];
                AttachmentData = [];
                let isMerchantRole =
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD;
                //let checkAssign = this.byId('fileUploader1').getValue();
                if (oEvent) {
                    let oButton = oEvent.getSource();
                    let sButtonId = oButton.getId();
                    var sText = oButton.getText();

                    let sButtonBaseId = sButtonId.split('--').pop();
                    if (sButtonBaseId === 'btnSave') {
                        saveorsubmit = 'SAVE';
                    } else if (sButtonBaseId === 'btnSubmit') {
                        saveorsubmit = 'SUBMIT';
                    } else if (sButtonBaseId === 'btnHold') {
                        saveorsubmit = 'HOLD';
                    } else {
                        saveorsubmit = 'SUBMIT';
                    }
                }

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();

                // Run validations only when saveorsubmit === 'SUBMIT'
                if (saveorsubmit === 'SUBMIT') {

                    if (
                        oSelectDiamension &&
                        (oData.Length === '' ||
                            oData.TolLength === '' ||
                            oData.Width === '' ||
                            oData.TolWidth === '' ||
                            oData.Height === '' ||
                            oData.TolHeight === '' ||
                            oData.Diameter === '' ||
                            oData.TolDiameter === '' ||
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
                            oData.Diameter === '' ||
                            oData.TolDiameter === '' ||
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
                        this.isEmpty(oData.CrfCategory) ||
                        this.isEmpty(oData.ReqTyp) ||
                        this.isEmpty(oData.InputType) ||
                        this.isEmpty(oData.CrfReqDate) ||
                        this.isEmpty(oData.ProductCatName) ||
                        this.isEmpty(oData.MCatName) ||
                        this.isEmpty(oData.SubCatName) ||
                        this.isEmpty(oData.BuyerName) ||
                        this.isEmpty(oData.BrandName)
                    ) {
                        MessageToast.show('Please Fill Mandatory Fields');
                        return;
                    }

                    if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR && (this.isEmpty(oData.CADLevel) || this.isEmpty(oData.CrfDelDate))) {
                        MessageToast.show('Please Select CAD Level');
                        return;
                    }

                    if (oData.UserAssign && oData.UserAssign.length > 0 && RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                        if (!this.ValidateUserAssign(oData.UserAssign)) {
                            return;
                        }
                    }

                    if (oData.Team && oData.Team.length === 0 && saveorsubmit === 'SUBMIT') {
                        MessageToast.show('Please Select Team Users');
                        return
                    }
                    if (oData.InspDraw && (saveorsubmit === 'SUBMIT' && isMerchantRole)) {
                        let filterData = oData.InspDraw.filter(item => item.RowStatus === 'OPEN');

                        let dataToPass = oData.ReqTyp == 'R' ? filterData : oData.InspDraw;

                        // //temporary comment DMS - Trupti 28102025
                        if (!this.ValidateInspAttachment(dataToPass)) {
                            return;
                        }
                    }
                    if (oData.InspDraw && (/*oData.SaveOrSubmit*/saveorsubmit === 'SUBMIT' && !isMerchantRole)) {
                        // //temporary comment DMS - Trupti 28102025
                        if (!this.ValidateApprovalAttachment()) {
                            return;
                        }
                    }
                }

                if (oData.UserAssign != null) {
                    var duplicates = this.findDuplicateEntries(oData.UserAssign);
                    if (duplicates.length > 0) {
                        MessageToast.show('Duplicate User Found! Please Select Diffrent User', duplicates);
                        return;
                    }
                }


                // if ((saveorsubmit == 'SUBMIT' &&
                //     RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR)
                // ) {
                //     MessageToast.show('Please Select Attachment otherwise Save as Draft!');
                //     return;
                // }
                // if ((RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST || RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL || RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL)
                // ) {
                //     MessageToast.show('Attachment is Mandatory for Approval!');
                //     return;
                // }

                // const oResponseModel = this.getView().getModel("AttachmentRefModel");
                // let oDataAttachRes = oResponseModel.getData();
                // const attachmentEnum = oDataAttachRes.value[1].EnumCode

                const model = this.getView().getModel("AttachmentRefModel");
                const d = model?.getData();

                const attachmentEnum =
                    d && Array.isArray(d.value) && d.value[1] != null
                        ? d.value[1].EnumCode
                        : null;
                const attachmentEnumSingle =
                    d && Array.isArray(d.value) && d.value[2] != null
                        ? d.value[2].EnumCode
                        : null;



                //this._aBase64FilesMultiple.forEach(function (oFile, index) { //Trupti
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
                    };
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
                // (this._aBase64FileSingle.Attachment || []).forEach(function (oFile) {
                //     AttachmentData.push({
                //         AttachmentGuId: null,
                //         AttachmentName: AttachmentName,
                //         OrgFileName: AttachmentName.split(".")[0],
                //         OrgFileExtension: OrgFileExtension,
                //         SysFileName: "",
                //         SysFileExtension: OrgFileExtension,
                //         ReferenceType: attachmentEnumSingle,
                //         ReferenceId: null,
                //         ReferenceGuid: "",
                //         SysFilePath: "",
                //         Base64File: fileBase64
                //     });
                // });
                oPayload = {
                    AttachmentData,
                };
                let isValid = (oPayload.AttachmentData.length !== 0);
                // //temporary comment DMS - Trupti 28102025
                //isValid = false;

                if (isValid) {
                    await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-attachment/DAttachments', oPayload, 'attachResModel');
                    let attachModel = this.getView().getModel('attachResModel').getData();
                    console.log(attachModel);
                    oModel.setData(oData);
                    this.onSaveNew(saveorsubmit);
                }
                else {
                    this.onSaveNew(saveorsubmit);
                }
            },

            isEmpty: function (value) {
                return value === null || value === undefined || value === '';
            },

            addMeeting: function (oEvent) {
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                var newRow = {
                    CallMeeting: 'Y',
                    CrfUserAttachmentAbsId_AbsId: null,
                    DepartmentName: null,
                    DepartmentCode: null,
                    IsMeetingAttended: null,
                    Remarks: null,
                    UserID_UserGuid: null,
                    UserCode: null,
                    UserName: null,
                    UserEmailId: null,
                    DepartmentID: null,
                    RowNumber: 0,
                    isEditable: true,
                    MeetingStartDate: oViewModel.UserAssign[0].MeetingStartDate,
                    MeetingEndDate: oViewModel.UserAssign[0].MeetingEndDate,
                    CrfReqID_CrfReqUUID: this.getListViewEditPropertyValue(),
                    UserAvailable: null
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

            onDeleteTeam: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                this.deleteRow(this.getEntryFormDataSourceModelName(), 'Team', iIndex);

                let oTeamModel = this.getView().getModel("teamModel");
                let oData = oTeamModel.getData();
                oData.value[iIndex].Selected = false;
                this.getView().setModel(oTeamModel, "teamModel");
            },

            addRaiseQuery: function () {
                let newRow =
                {
                    Answer: null,
                    CrfSeekAdviceGuid: null,
                    DelMark: 0,
                    DepartmentCode: null,
                    DepartmentName: null,
                    NewAlert: "Y",
                    Parent_CrfReqGuid: null,
                    Question: null,
                    QuestionFromUserName: null,
                    QuestionFromUser_UserGuid: null,
                    QuestionToUserName: null,
                    QuestionToUser_UserGuid: null,
                    Role_RoleGuid: null,
                    RowNumber: 0,
                    SendEmailQuestion: null,
                    SendEmailAnswer: null,
                    Attachment: []
                };
                this.addRowInObj('SeekAdvice', newRow, 'RowNumber');
            },

            addMaterialRow: function () {
                var newRow = {
                    MaterialAutoCode: null,
                    MaterialCatHanaText: null,
                    MaterialCatFreeText: null,
                    Remarks: null,
                    RowNumber: 0,
                    DelMark: 0
                };
                this.addRowInObj('Material', newRow, 'RowNumber');
            },

            onDeleteSeekAdvice: function (oEvent) {
                var iIndex = oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent());
                let MasterData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData()
                let data = MasterData.SeekAdvice[iIndex].Attachment
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

                this.deleteRow(this.getEntryFormDataSourceModelName(), 'SeekAdvice', iIndex);
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
                await this.deleteRow(this.getEntryFormDataSourceModelName(), 'InspDraw', iIndex);
                let oModelAttachAdd = this.getView().getModel("AttachModel");
                if (oModelAttachAdd) {
                    oModelAttachAdd.setData({});
                    oModelAttachAdd.refresh(true);
                }
            },
            // onDeleteAttachment: async function (oEvent) {

            //     var oSource = oEvent.getSource();
            //     var oContext = oSource.getBindingContext(this.getEntryFormDataSourceModelName());
            //     var sPath = oContext.getPath();
            //     // example:
            //     // /InspDraw/0
            //     // /MainAttachment/0

            //     let MasterData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();

            //     let filesPayloadModel = this.getView().getModel("filesPayload");
            //     let filesPayload = filesPayloadModel?.getData() || { Files: [] };

            //     // ===== InspDraw delete =====
            //     if (sPath.includes("InspDraw")) {

            //         let iIndex = parseInt(sPath.split("/")[2]);

            //         let data = MasterData.InspDraw[iIndex].Attachment || [];

            //         let inspDrawFiles = data
            //             .filter(item => item.AttachmentGuId)
            //             .map(item => ({
            //                 AttachmentGuId: item.AttachmentGuId
            //             }));

            //         filesPayload.Files.push(...inspDrawFiles);

            //         await this.deleteRow(this.getEntryFormDataSourceModelName(), 'InspDraw', iIndex);

            //     }

            //     // ===== MainAttachment delete =====
            //     else if (sPath.includes("MainAttachment")) {

            //         let iIndex = parseInt(sPath.split("/")[2]);

            //         let attachmentGuid = MasterData.MainAttachment?.[iIndex]?.Attachment?.AttachmentGuId;

            //         if (attachmentGuid) {

            //             filesPayload.Files.push({
            //                 AttachmentGuId: attachmentGuid
            //             });

            //         }

            //         await this.deleteRow(this.getEntryFormDataSourceModelName(), 'MainAttachment', iIndex);

            //     }

            //     // Save filesPayload model
            //     this.getView().setModel(new sap.ui.model.json.JSONModel(filesPayload), "filesPayload");

            //     // Clear AttachModel
            //     let oModelAttachAdd = this.getView().getModel("AttachModel");

            //     if (oModelAttachAdd) {
            //         oModelAttachAdd.setData({});
            //         oModelAttachAdd.refresh(true);
            //     }

            // },
            DeleteAttachmentFromDMS_Old: async function () {
                let filesPayload = this.getView().getModel("filesPayload");
                if (filesPayload?.Files.length > 0) {
                    await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DeleteAttachmentFromDMS", filesPayload, "DeleteAttachModel");
                }
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
                this._iRowIndex = iRowIndex;
                this._oSelectedRowContext = oSelectedRowContext;
                dialog.open(oSelectedRowContext, oSelectedData);
            },

            handleFragmentSelection: async function (sReplyValue) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty(this._oSelectedRowContext.getPath() + '/Answer', sReplyValue);
                // call api to save Reply (Answer)
                let guid = oModel.getProperty(this._oSelectedRowContext.getPath()).CrfSeekAdviceGuid
                let payload = {
                    Answer: oModel.getProperty(this._oSelectedRowContext.getPath()).Answer
                }
                await this.createNewModelUsingAPI(
                    'PATCH',
                    `/odata/v4/stoneman-crf/TcrfSeekAdvice('${guid}')`,
                    payload,
                    'SavedSeekAdviceModel'
                );
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
                dialog.open();
            },

            getApproveRejectComment: function (sReplyValue) {
                //let checkTechFile = this.byId('techAttachFile').getValue();
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData()
                oModel.setProperty('/ApprovalComments', sReplyValue.Comment);
                oModel.setProperty('/ApprovalStatus', sReplyValue.Status);
                oModel.setProperty('/newApprovalComment', sReplyValue.Comment);
                oModel.setProperty('/newApprovalStatus', sReplyValue.Status);
                if (
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.MERCHANT_ATL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.HEAD ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL ||
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL
                ) {
                    if (oData.CrfStageCode === 'CRF_BUYER_APPROVAL_PENDING') {
                        this.onSaveNew(null);
                    } else {
                        this.onUploadPress();
                    }
                }
            },

            updateControlStates: function (enableDisableArray) {
                var view = this.getView();
                enableDisableArray.forEach(function (item) {
                    var control = view.byId(item.CONTROLID);
                    if (control && control.setEnabled) {

                        //24/06/25 -> fix issue integere returned by API instead of boolean
                        //control.setEnabled(item.ENABLED);
                        if (Number.isInteger(item.ENABLED))
                            control.setEnabled(!!item.ENABLED);
                        else
                            control.setEnabled(item.ENABLED);
                        //
                    }
                });
                let editStage = this.getView().getModel(this.getEntryFormDataSourceModelName()).getProperty('/CrfStageCode');
                let y = {
                    EnableDisbale: editStage === "CRF_MEETING_SETUP" && RoleInfo.RoleName === "PD_COORDINATOR"
                };

                var oModel1 = new sap.ui.model.json.JSONModel(y);
                oModel1 = this.getView().setModel(oModel1, 'EnableCheck');
                this.disableTablePDDRRA(enableDisableArray);
                this.disableTableMaterial(enableDisableArray);
                //this.disableTableAttachment(enableDisableArray);
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
                                return sControlId.includes(controlItem.CONTROLID);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                // Check if the control has the setEnabled method and is in the response
                                item.setEnabled(Boolean(Number(controlState.ENABLED))); // Set the enabled state based on the API response
                            }
                        });
                    });
                }
            },

            disableTableMaterial: function (enableDisableArray) {
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
                                return sControlId.includes(controlItem.CONTROLID);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                item.setEnabled(Boolean(Number(controlState.ENABLED)));
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
                                return sControlId.includes(controlItem.CONTROLID);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                // Check if the control has the setEnabled method and is in the response
                                item.setEnabled(controlState.ENABLED); // Set the enabled state based on the API response
                            }
                        });
                    });
                }
            },

            onEnableDisableChange: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                let oCurrentDate = new Date();
                let oFormattedDate = formatter.getDateFromatIn_ddMMyyyy(oCurrentDate);
                oModel.setProperty('/CrfReqDate', oFormattedDate)
                if (oData.ReqTyp === 'R') {
                    this.byId('oldCadReq').setVisible(true);
                    this.byId('crfNo').setVisible(false);
                    this.byId('ecnNo').setVisible(true);
                    this.byId('carNo').setVisible(true);
                    this.byId('cadDetailNo').setVisible(true);
                }

                else {

                    oModel.setProperty('/ReqTyp', 'N');
                    this.byId('oldCadReq').setVisible(false);
                    this.byId('cadDetailNo').setVisible(false);
                    this.byId('crfNo').setVisible(false);
                    this.byId('ecnNo').setVisible(false);
                    this.byId('carNo').setVisible(false);


                }

                this.setDataOnReqTypeChange();
            },
            onCategoryChange: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                if (formMode != '2') {
                    if (oData.CrfCategory === "Rendering" && oData.ReqTyp == "N") {
                        this.byId('IsReCostingReqID').setVisible(false);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('CRFCostingTypeID').setVisible(false);
                        this.byId('IsReCostingReqID').setEditable(false);
                        this.byId('CrfApprovalReqID').setEditable(false);
                        this.byId('CRFCostingTypeID').setEditable(false);
                        oModel.setProperty('/CostingType', 'Rendering')
                        oModel.setProperty('/CrfApprovalReq', 'Y')
                        oModel.setProperty('/ReCostingReq', null)
                        oModel.setProperty('/OnlycostingRequired', true)
                    }
                    else if (oData.CrfCategory === "Rendering" && oData.ReqTyp == "R") {
                        oModel.setProperty('/ReCostingReq', 'N');
                        oModel.setProperty('/CrfApprovalReq', 'Y');
                        this.byId('IsReCostingReqID').setVisible(true);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('IsReCostingReqID').setEditable(true);
                        this.byId('CrfApprovalReqID').setEditable(true);
                        this.byId('CRFCostingTypeID').setVisible(false);
                        this.byId('CRFCostingTypeID').setEditable(false);
                        oModel.setProperty('/CostingType', 'Rendering')
                        oModel.setProperty('/OnlycostingRequired', true)
                    }
                    else if (oData.CrfCategory === "CAD" && oData.ReqTyp == "N") {
                        this.byId('IsReCostingReqID').setVisible(false);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('IsReCostingReqID').setEditable(false);
                        this.byId('CrfApprovalReqID').setEditable(false);
                        this.byId('CRFCostingTypeID').setVisible(true);
                        this.byId('CRFCostingTypeID').setEditable(true);
                        oModel.setProperty('/CrfApprovalReq', 'Y')
                        oModel.setProperty('/ReCostingReq', null)
                        if (oData.CostingType === "CAD-OnlyCosting") {
                            oModel.setProperty('/OnlycostingRequired', true)
                        }
                        else if (oData.CostingType === "CAD") {
                            oModel.setProperty('/OnlycostingRequired', false)
                        }
                        else if (oData.CostingType === "Sample") {
                            oModel.setProperty('/OnlycostingRequired', false)
                        }
                    }
                    else if (oData.CrfCategory === "CAD" && oData.ReqTyp == "R") {
                        this.byId('CRFCostingTypeID').setVisible(true);
                        this.byId('CRFCostingTypeID').setEditable(true);
                        this.byId('IsReCostingReqID').setVisible(false);
                        oModel.setProperty('/OnlycostingRequired', true);
                        oModel.setProperty('/ReCostingReq', 'Y');
                        //oModel.setProperty('/CostingType', 'Sample');
                        if (oData.CostingType === "Rendering") {
                            oModel.setProperty('/CostingType', null)
                        }
                        if (oData.CostingType === "CAD-OnlyCosting") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(true);
                            oModel.setProperty('/OnlycostingRequired', true)
                        }
                        else if (oData.CostingType === "CAD") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(false);
                            oModel.setProperty('/CrfApprovalReq', 'N')
                            oModel.setProperty('/OnlycostingRequired', false)
                        }
                        else if (oData.CostingType === "Sample") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(false);
                            oModel.setProperty('/CrfApprovalReq', 'N')
                            oModel.setProperty('/OnlycostingRequired', false)
                        }
                    }
                }
                else {
                    if (oData.CrfCategory === "Rendering" && oData.ReqTyp == "N") {
                        this.byId('IsReCostingReqID').setVisible(false);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('CRFCostingTypeID').setVisible(false);
                        this.byId('IsReCostingReqID').setEditable(false);
                        this.byId('CrfApprovalReqID').setEditable(false);
                        this.byId('CRFCostingTypeID').setEditable(false);
                        // oModel.setProperty('/CostingType', 'Rendering')
                        // oModel.setProperty('/CrfApprovalReq', 'Y')
                        // oModel.setProperty('/ReCostingReq', null)
                        // oModel.setProperty('/OnlycostingRequired', true)
                    }
                    else if (oData.CrfCategory === "Rendering" && oData.ReqTyp == "R") {
                        // oModel.setProperty('/ReCostingReq', 'N');
                        // oModel.setProperty('/CrfApprovalReq', 'Y');
                        this.byId('IsReCostingReqID').setVisible(true);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('IsReCostingReqID').setEditable(true);
                        this.byId('CrfApprovalReqID').setEditable(true);
                        this.byId('CRFCostingTypeID').setVisible(false);
                        this.byId('CRFCostingTypeID').setEditable(false);
                        // oModel.setProperty('/CostingType', 'Rendering')
                        // oModel.setProperty('/OnlycostingRequired', true)
                    }
                    else if (oData.CrfCategory === "CAD" && oData.ReqTyp == "N") {
                        this.byId('IsReCostingReqID').setVisible(false);
                        this.byId('CrfApprovalReqID').setVisible(true);
                        this.byId('IsReCostingReqID').setEditable(false);
                        this.byId('CrfApprovalReqID').setEditable(false);
                        this.byId('CRFCostingTypeID').setVisible(true);
                        this.byId('CRFCostingTypeID').setEditable(true);
                        // oModel.setProperty('/CrfApprovalReq', 'Y')
                        // oModel.setProperty('/ReCostingReq', null)
                        // if (oData.CostingType === "CAD-OnlyCosting") {
                        //     oModel.setProperty('/OnlycostingRequired', true)
                        // }
                        // else if (oData.CostingType === "CAD") {
                        //     oModel.setProperty('/OnlycostingRequired', false)
                        // }
                        // else if (oData.CostingType === "Sample") {
                        //     oModel.setProperty('/OnlycostingRequired', false)
                        // }
                    }
                    else if (oData.CrfCategory === "CAD" && oData.ReqTyp == "R") {
                        this.byId('CRFCostingTypeID').setVisible(true);
                        this.byId('CRFCostingTypeID').setEditable(true);
                        this.byId('IsReCostingReqID').setVisible(false);
                        // oModel.setProperty('/OnlycostingRequired', true);
                        // oModel.setProperty('/ReCostingReq', 'Y');
                        //oModel.setProperty('/CostingType', 'Sample');
                        // if (oData.CostingType === "Rendering") {
                        //     oModel.setProperty('/CostingType', null)
                        // }
                        if (oData.CostingType === "CAD-OnlyCosting") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(true);
                            // oModel.setProperty('/OnlycostingRequired', true)
                        }
                        else if (oData.CostingType === "CAD") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(false);
                            // oModel.setProperty('/CrfApprovalReq', 'N')
                            // oModel.setProperty('/OnlycostingRequired', false)
                        }
                        else if (oData.CostingType === "Sample") {
                            this.byId('CrfApprovalReqID').setVisible(true);
                            this.byId('CrfApprovalReqID').setEditable(false);
                            // oModel.setProperty('/CrfApprovalReq', 'N')
                            // oModel.setProperty('/OnlycostingRequired', false)
                        }
                    }
                }

            },
            onRadioChange: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const sIsReCosting = oModel.getProperty("/ReCostingReq");
                const sIsCrfApproval = oModel.getProperty("/CrfApprovalReq");

                if (sIsReCosting === "N" && sIsCrfApproval === "N") {
                    sap.m.MessageBox.error(
                        "PDRM Meeting Required and Is Costing Required can not be set to 'NO'"
                    );
                    oModel.setProperty("/ReCostingReq", "Y");
                    this.byId("IsReCostingReqID").setSelectedIndex(0);
                }
            },
            setDataOnReqTypeChange: function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oModel.setProperty('/BuyerCode', null);
                this.byId('crfCategory').setValue(null);
                this.byId('oldCadReq').setValue(null);
                this.byId('cadDetailNo').setValue(null);
                this.byId('cadReqNo').setValue(null);
                this.byId('inputType').setValue(null);
                this.byId('matCategory').setValue(null);
                this.byId('prodCatType').setValue(null);
                this.byId('buyer').setValue(null);
                this.byId('catCode').setValue(null);
                this.byId('itemDesc').setValue(null);
                this.byId('cadDeliveryDate').setValue(null);
                this.byId('diaMeter').setValue(null);
                this.byId('diaMeterTolerance').setValue(null);
                this.byId('pdDate').setValue(null);
                this.byId('clientRemarks').setValue(null);
                this.byId('ecnNo').setValue(null);
                this.byId('carNo').setValue(null);
                this.byId('crfNo').setValue(null);
                this.byId('buyer').setValue(null);
                this.byId('brand').setValue(null);
                this.byId('subCategory').setValue(null);
                this.byId('estimCost').setValue(null);
                this.byId('buyerCurr').setValue(null);
                this.byId('estimCostCurr').setValue(null);
                this.byId('excRate').setValue(null);
                this.byId('dUnitCode').setValue(null);
                this.byId('cadLevelCombo').setValue(null);
                this.byId('lightingHolder').setValue(null);
                this.byId('lightingShape').setValue(null);
                this.byId('lightingCord').setValue(null);
                this.byId('lightingCountry').setValue(null);
                this.byId('Dlength').setValue(0);
                this.byId('DTolerance').setValue(0);
                this.byId('Dwidth').setValue(0);
                this.byId('dWTolerance').setValue(0);
                this.byId('Dheight').setValue(0);
                this.byId('dHTolerance').setValue(0);
                this.byId('diaMeter').setValue(0);
                this.byId('diaMeterTolerance').setValue(0);
                this.byId('dUnit').setValue(null);
                oModel.setProperty('/Material', [
                    {
                        MaterialAutoCode: null,
                        MaterialCatHanaText: null,
                        MaterialCatFreeText: null,
                        Remarks: null,
                        RowNumber: 1,
                        TestProtocol: null,
                        UserComments: null
                    }
                ]);
                oModel.setProperty('/Team', []);
                oModel.setProperty('/InspDraw', []);
                oModel.setProperty('/SeekAdvice', []);
                oModel.setProperty('/UserAssign', []);
                oModel.setProperty('/InspDraw', []);
                this.onSelectLightning();
                this.getTemplateDataForEnableDisable();
            },

            onChangeOldCrfReqNo: async function () {
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqId = y.getProperty('/CrfReqGuid');

                // Fetch data from the 
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/TCrfHeader?$expand=Team,Material($filter=DelMark eq 0),InspDraw($expand=User($expand=Role),Attachment $filter=DelMark eq 0)&$filter=CrfReqGuid eq '${reqId}'`,
                    '',
                    'reqModel'
                );

                let reqModel = this.getView().getModel('reqModel');
                let aData = reqModel.getData();
                let resRepeatModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqValue = reqModel.getProperty('/value/0');

                // Mapping fields dynamically
                const fieldsToMap = [
                    'BrandCode', 'BrandName', 'BuyerGuid', 'Brand_BuyerBrandGuid', 'BuyerName',
                    'BuyerCode', 'BuyerCur', 'CADLevel', 'CategoryCode', 'CrfDelDate',
                    'CrfReqDate', 'CrfReqGuid', 'Diameter', 'EstCostInDocCur', 'ProductCatName', 'ProductCatCode',
                    'EstCostInINR', 'ExchRate', 'InputType', 'Category', 'ItemDesc', 'Reamrks',
                    'MCatCode', 'SubCatCode', 'SubCatName', 'CrfStageCode', 'CrfStageName', 'MCatName', 'ApprovalStatus', 'Length',
                    'TolLength', 'Width', 'TolWidth', 'Height', 'TolHeight', 'TolDiameter', 'HolderCode', 'HolderName', 'ShapeCode', 'ShapeName',
                    'CordCode', 'CordName', 'CountryCode', 'CountryDescription',
                    'UnitCode', 'UnitName', 'PDDate', 'ProductCatGuid_ProductCategoryGuid', 'MaterialComments'
                ];

                fieldsToMap.forEach(field => {
                    resRepeatModel.setProperty(`/${field}`, reqValue[field]);
                    resRepeatModel.setProperty(`/CrfReqGuid`, null);
                    resRepeatModel.setProperty(`/CrfDelDate`, null);
                    resRepeatModel.setProperty(`/CADLevel`, null);
                    resRepeatModel.setProperty(`/CrfStageCode`, 'CRF_FORMFILL');
                    resRepeatModel.setProperty(`/CrfStageName`, 'CRF_FORMFILL');
                    resRepeatModel.setProperty(`/CrfStatus`, 'New');
                    resRepeatModel.setProperty(`/ApprovalStatus`, 'NA');
                });

                // Process materials and team data
                ['Material'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.RowNumber = index + 1;
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });
                ['Team'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.CrfTeamGuid = null;
                        item.Parent_CrfReqGuid = null;
                        item.RowNumber = index + 1;
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });

                // mansi
                ['InspDraw'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.CrfTeamGuid = null;
                        item.Parent_CrfReqGuid = null;
                        item.RowNumber = index + 1;
                        item.RoleName = item.User.UserRoleCode;
                        item.UserName = item.User.UserName;
                        item.RowStatus = 'REFERENCE';
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });

                resRepeatModel.setProperty('/SeekAdvice', []);
                resRepeatModel.setProperty('/UserAssign', []);

                //this.getAllExpendData(aData.value[0]);
                this.getBuyerBrandData(reqValue.BuyerGuid);
                this.getTeamUser();
                this.getTemplateDataForEnableDisable();

                let resRepData = resRepeatModel.getData();
                this.checkForProdCategoryForLighting(resRepData.ProductCatName);

            },

            onChangeCADDetailNo: async function () {
                let y = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqId = y.getProperty('/CrfReqUUID_CrfReqUUID');

                // Fetch data from the API
                await this.createNewModelUsingAPI(
                    'GET',
                    `/odata/v4/stoneman-crf/TCrfHeader?$expand=MerTeamHead,MerTL,MerATL,TechnoUserId,PDCUserId,QualityATLUserId,QualityTLUserId,DesignerUserId,Material,InspDraw($expand=DraftUserID,DraftAttachmentAbsId,InspRefDocAbsId)&$filter=CrfReqGuid eq ${reqId}`,
                    '',
                    'cadDetailReqModel'
                );

                let cadReqModel = this.getView().getModel('cadDetailReqModel');
                let aData = cadReqModel.getData();
                let x = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let reqValue = cadReqModel.getProperty('/value/0');

                // Mapping fields dynamically
                const fieldsToMap = [
                    'BrandCode', 'BrandName', 'BuyerGuid', 'Brand_BuyerBrandGuid', 'BuyerName',
                    'BuyerCode', 'BuyerCur', 'CADLevel', 'CategoryCode', 'CrfCategory', 'CrfDelDate',
                    'CrfReqDate', 'CrfReqGuid', 'Diameter', 'EstCostInDocCur', 'ProductCatName', 'ProductCatCode',
                    'EstCostInINR', 'ExchRate', 'InputType', 'Category', 'ItemDesc', 'Reamrks',
                    'MCatCode', 'SubCatCode', 'SubCatName', 'CrfStageCode', 'CrfStageName', 'MCatName', 'ApprovalStatus', 'Length',
                    'TolLength', 'Width', 'TolWidth', 'Height', 'TolHeight', 'TolDiameter', 'HolderCode', 'HolderName', 'ShapeCode', 'ShapeName',
                    'CordCode', 'CordName', 'CountryCode', 'CountryDescription',
                    'UnitCode', 'UnitName', 'PDDate', 'ProductCatGuid_ProductCategoryGuid'
                ];

                fieldsToMap.forEach(field => {
                    resRepeatModel.setProperty(`/${field}`, reqValue[field]);
                    resRepeatModel.setProperty(`/CrfReqGuid`, null);
                    resRepeatModel.setProperty(`/CrfDelDate`, null);
                    resRepeatModel.setProperty(`/CADLevel`, null);
                    resRepeatModel.setProperty(`/CrfStageCode`, 'CRF_FORMFILL');
                    resRepeatModel.setProperty(`/CrfStageName`, 'CRF_FORMFILL');
                    resRepeatModel.setProperty(`/CrfStatus`, 'New');
                    resRepeatModel.setProperty(`/ApprovalStatus`, 'NA');
                });

                // Process materials and team data
                ['Material'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.RowNumber = index + 1;
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });
                ['Team'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.CrfTeamGuid = null;
                        item.Parent_CrfReqGuid = null;
                        item.RowNumber = index + 1;
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });
                ['InspDraw'].forEach(entity => {
                    let data = aData.value[0][entity];
                    data.forEach((item, index) => {
                        item.RowNumber = index + 1;
                        item.isNewRow = false;
                        item.isDownloadVisible = true;
                    });
                    resRepeatModel.setProperty(`/${entity}`, data);
                });

                resRepeatModel.setProperty('/SeekAdvice', []);
                resRepeatModel.setProperty('/UserAssign', []);

                //this.getAllExpendData(aData.value[0]);
                this.getBuyerBrandData(reqValue.BuyerGuid);
                this.getTeamUser();
                this.getTemplateDataForEnableDisable();

                // Handle expandable data
                //this.getAllExpendData(aData.value[0]);
            },


            onSaveNew: async function (saveorsubmit) {

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
                let oDateFormat = DateFormat.getDateInstance({ pattern: 'yyyy-MM-dd' });
                let crfDelDate = this.byId('cadDeliveryDate').getDateValue();
                let crfPDDate = this.byId('pdDate').getDateValue();
                let crfReqDate = this.byId('crfReqDate').getDateValue();
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
                    RoleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST
                // oData.StageCode_StageConstant.includes('CRF_BUYER_APPROVAL_PENDING');
                //let isPDCoordinatorRole = RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR;
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                if (saveorsubmit === "SAVE") {
                    if (oData.UserAssign && oData.UserAssign.length > 0 && RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {
                        if (!this.ValidateUserOnSaveAssign(oData.UserAssign)) {
                            return;
                        }
                    }
                }
                this.editResponse = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel('CRFSaveRequestModel').getData();

                srcObject.CreatedByUserID_UserGuid = formMode === '3' ? RoleInfo.UserID : oData.CreatedByUserID_UserGuid;
                srcObject.appliDiamter = oData.isDiamter == true ? 'Y' : 'N';
                srcObject.appliDimension = oData.isDimension == true ? 'Y' : 'N';
                srcObject.loginUserID_UserGuid = RoleInfo.UserID;
                srcObject.CrfReqDate = oData.ReqTyp == 'N' ? formattedDate : oDateFormat.format(crfReqDate);
                srcObject.CrfStatus = oData.CrfStatus;
                srcObject.CrfStageCode = oData.CrfStageCode;
                srcObject.SaveOrSubmit = (saveorsubmit === undefined || saveorsubmit === null) ? 'SUBMIT' : saveorsubmit;
                //srcObject.PDCAttachmentAbsId_AbsId = isPDCoordinatorRole ? absIDPDDRAMeeting : oData.PDCAttachmentAbsId_AbsId;
                srcObject.PDDate = oDateFormat.format(crfPDDate);
                srcObject.CrfDelDate = (isMerchantRole && srcObject.ApprovalStatus === 'NA') ? null : oDateFormat.format(crfDelDate);

                if (isQualityOrTechnologistRole || (isMerchantRole && oData.ApprovalStatus === 'APPROVED')) {
                    if (((saveorsubmit === "HOLD" && this.byId('btnHold').getText() === 'Hold') || (isMerchantRole && this.byId('btnHold').getText() === 'Resume'))) {
                        srcObject.newApprovalStatus = "";
                        srcObject.newApprovalComment = "";
                    } else {
                        srcObject.TotalApproved = 0;
                        srcObject.TotalRejected = 0;
                        srcObject.newApprovalStatus = oData.ApprovalStatus;
                        srcObject.newApprovalComment = oData.ApprovalComments;
                    }
                }

                if (formMode == '2') {
                    srcObject.ApprovalTransaction.forEach(function (item) {
                        delete item.endDte;
                        delete item.startDte;
                    });

                    srcObject.UserAssign.forEach(function (item) {
                        item.MeetingStartDate = item.MeetingStartDate != null ? formatter.convertToISOFormat(item.MeetingStartDate) : null;
                        item.MeetingEndDate = item.MeetingStartDate != null ? formatter.convertToISOFormat(item.MeetingEndDate) : null;
                        delete item.isEditable;
                    });
                } else {//add = 3
                    srcObject.ApprovalTransaction = [];
                    srcObject.UserAssign = [];
                    if (srcObject.ReqTyp === 'R') {
                        srcObject.InspDraw.forEach(element => {
                            if (element.RowStatus === 'CLOSED' || element.RowStatus === 'REFERENCE') {
                                element.RowStatus = 'REFERENCE';
                                delete element.CrfAttachmentsGuid;
                                delete element.Parent_CrfReqGuid;

                                element.Attachment.forEach(ele => {
                                    delete ele.ReferenceGuid;
                                    delete ele.AttachmentGuId;
                                });
                            }
                            //element.RowStatus = element.RowStatus === 'CLOSED' ? 'REFERENCE' : element.RowStatus;
                        });
                    }
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
                //const resforMainAttachment = this.getApiResponseObject();

                console.log(res)
                if (isMerchantRole && srcObject.ApprovalStatus !== 'APPROVED' && srcObject.ApprovalStatus !== 'REJECTED') {
                    if (res.success == true) {
                        const responseObject = res.object
                        if (res.object.SaveOrSubmit === 'SUBMIT') {
                            MessageToast.show('CAD Created Successfully ' + responseObject.CrfReqNo);
                            if (formMode === '2') {//edit
                                await this.createNewModelUsingAPI(
                                    'GET',
                                    `/odata/v4/stoneman-crf/TCrfHeader?$expand=Team,Material($filter=DelMark eq 0),MainAttachment($expand=Attachment),InspDraw($expand=User($expand=Role),Attachment $filter=DelMark eq 0)&$filter=CrfReqGuid eq '${responseObject.CrfReqGuid}'`,
                                    '',
                                    'getCrfEntryFormDataModel'
                                );
                                const oModelPDRMDate = this.getView().getModel('getCrfEntryFormDataModel').getData();;
                                // await this.onUpdateAttachmentData(oModelPDRMDate.value[0].InspDraw);
                                //await this.onUpdateImageData(oModelPDRMDate.value[0].MainAttachment);
                            }
                            else {
                                //await this.onUpdateAttachmentData(responseObject.InspDraw);
                                //await this.onUpdateImageData(responseObject.MainAttachment);
                            }
                        }
                        else if (res.object.SaveOrSubmit === 'SAVE') {

                            if (res.object.CrfReqGuid !== null && res.object.CrfReqGuid !== undefined) {
                                MessageToast.show('CRF Updated Successfully ' + res.object.CrfReqNo);
                                await this.createNewModelUsingAPI(
                                    'GET',
                                    `/odata/v4/stoneman-crf/TCrfHeader?$expand=Team,Material($filter=DelMark eq 0),MainAttachment($expand=Attachment),InspDraw($expand=User($expand=Role),Attachment $filter=DelMark eq 0)&$filter=CrfReqGuid eq '${res.object.CrfReqGuid}'`,
                                    '',
                                    'getCrfEntryFormDataModel'
                                );
                                const oModelPDRMDate = this.getView().getModel('getCrfEntryFormDataModel').getData();;
                                // await this.onUpdateAttachmentData(oModelPDRMDate.value[0].InspDraw);
                                //await this.onUpdateImageData(oModelPDRMDate.value[0].MainAttachment);

                            }
                            else {
                                MessageToast.show('CRF Save Successfully ' + res.object.CrfReqNo);
                                //await this.onUpdateAttachmentData(res.object.InspDraw);
                                //await this.onUpdateImageData(res.object.MainAttachment);
                            }
                        }
                        else {

                            if (saveorsubmit === "HOLD" && this.byId('btnHold').getText() === 'Hold') {
                                MessageToast.show('CRF is on Hold ' + res.object.CrfReqNo);
                            } else if (this.byId('btnHold').getText() === 'Resume') {
                                MessageToast.show('CRF is on Resume ' + res.object.CrfReqNo);
                            }
                        }

                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    }
                    else if (res.object.status == 502) {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseText);
                        return;
                    } else {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseJSON.error.details || res.object.responseJSON.error);
                        await this.clearAttachmentFragmentData();
                        return
                    }
                }
                else if (
                    isQualityOrTechnologistRole ||
                    (isMerchantRole && srcObject.ApprovalStatus === 'APPROVED') ||
                    (isMerchantRole && srcObject.ApprovalStatus === 'REJECTED')
                ) {
                    if (isMerchantRole && saveorsubmit === "HOLD" && this.byId('btnHold').getText() === 'Hold') {
                        MessageToast.show('CRF is on Hold ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (isMerchantRole && this.byId('btnHold').getText() === 'Resume') {
                        MessageToast.show('CRF is on Resume ' + res.object.CrfReqNo);
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    }
                    else if (res.object.ApprovalStatus === 'APPROVED') {

                        MessageToast.show('CRF has been Approved Successfully For ' + res.object.CrfReqNo);
                        if (isQualityOrTechnologistRole) {
                            await this.getCRFData();
                        }
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.object.ApprovalStatus === 'PENDING') {
                        MessageToast.show('CRF has been Approved Successfully For ' + res.object.CrfReqNo);
                        await this.getCRFData();
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    } else if (res.object.ApprovalStatus === 'REJECTED') {
                        MessageToast.show('CRF Rejected Successfully For ' + res.object.CrfReqNo);
                        if (isQualityOrTechnologistRole) {
                            await this.getCRFData();
                        }
                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            1000
                        );
                    }
                    else if (res.object.status == 502) {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseText);
                        await this.clearAttachmentFragmentData();
                        return;
                    } else {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseJSON.error.details || res.object.responseJSON.error);
                        await this.clearAttachmentFragmentData();
                        return
                    }
                }
                else {
                    console.log(this.editResponse)
                    if (res.success == true) {
                        if (res.object.CrfStatus === 'HOLD') {
                            MessageToast.show('CRF on Hold Successfully For ' + res.object.CrfReqNo);
                        } else {
                            MessageToast.show('CRF Updated Successfully For ' + res.object.CrfReqNo);
                        }
                        //this.editResponse = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                        await this.getCRFData();

                        setTimeout(
                            function () {
                                this.router.navTo(this.getBackwardRoute());
                            }.bind(this),
                            500
                        );
                    } else if (res.object.status == 502) {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseText);
                        await this.clearAttachmentFragmentData();
                        return;
                    } else {
                        this.onFailedSetDateFromatToDisplay();
                        await this.onErrorMessageDialogPress(res.object.responseJSON.error.details || res.object.responseJSON.error);
                        await this.clearAttachmentFragmentData();
                        return
                    }
                }
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

            getCRFData: async function () {
                await this.createNewModelUsingAPI(
                    "GET",
                    '/odata/v4/stoneman-crf/TCrfHeader(' + this.getListViewEditPropertyValue() + ')?$expand=InspDraw($expand=User($expand=Role),Attachment $filter=DelMark eq 0)',
                    "",
                    "TCRFResModel"
                );
                const crfResponse = this.getView().getModel("TCRFResModel");
                let crfData = crfResponse.getData();
                await this.onUpdateAttachmentData(crfData.InspDraw);
            },
            // onUpdateImageData: async function (res) {
            //     //temporary comment DMS - Trupti 28102025
            //     // return;

            //     const attachImageResModel = this.getView().getModel("attachResModel");
            //     if (attachImageResModel !== undefined) {
            //         const attachImgResData = attachImageResModel.getData();
            //         let attachmentData = [];
            //         let referenceGuid;
            //         // Since res is now an object, not array
            //         if (res) {

            //             referenceGuid = res.MainAttachmentGuid || res.Attachment?.ReferenceGuid || "";
            //             if (attachImgResData && attachImgResData.value && attachImgResData.value.length > 0) {

            //                 const attachmentResponses = attachImgResData.value[0].AttachmentDataResponse;

            //                 if (attachmentResponses && attachmentResponses.length > 0) {

            //                     // Find where ReferenceType = "21"
            //                     const targetAttachment = attachmentResponses.find(
            //                         item => item.ReferenceType === "21"
            //                     );

            //                     // if (targetAttachment) {

            //                     //     const mappedData = [{
            //                     //         AttachmentGuId: targetAttachment.AttachmentGuId,
            //                     //         ReferenceGuid: referenceGuid,
            //                     //         OrgFileName: targetAttachment.OrgFileName,
            //                     //         OrgFileExtension: targetAttachment.OrgFileExtension,
            //                     //         SysFileName: targetAttachment.SysFileName,
            //                     //         SysFileExtension: targetAttachment.OrgFileExtension,
            //                     //         ReferenceType: "21",
            //                     //         ReferenceId: targetAttachment.ReferenceId,
            //                     //         SysFilePath: targetAttachment.SysFilePath,
            //                     //         UploadedOnCloud:targetAttachment.UploadedOnCloud
            //                     //     }];

            //                     //     attachmentData = attachmentData.concat(mappedData);

            //                     // }
            //                     if (targetAttachment) {

            //                         const mappedData = [{
            //                             AttachmentGuId: targetAttachment.AttachmentGuId,
            //                             ReferenceGuid: referenceGuid
            //                         }];

            //                         attachmentData = attachmentData.concat(mappedData);

            //                     }
            //                 }
            //             }


            //         }
            //         // Wrap the resulting data into the desired structure
            //         const finalAttachmentData = { AttachmentData: attachmentData };
            //         console.log("Optimized Attachment Data:", attachmentData);
            //         if (attachmentData.length != 0) {
            //             await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/UpdateAttachmentData", finalAttachmentData, "updateAttachModel");
            //             let updateAttachModel = this.getView().getModel("updateAttachModel");
            //             let data = updateAttachModel.getData();
            //             console.log(data);
            //         }
            //         await this.clearAttachmentFragmentData();
            //     }
            // },
            onUpdateAttachmentData: async function (res) {
                //temporary comment DMS - Trupti 28102025
                // return;

                const attachmentResponse = this.getView().getModel("attachResModel");
                if (attachmentResponse !== undefined) {
                    const attachResData = attachmentResponse.getData();
                    let attachmentData = [];
                    let referenceGuid
                    // Process each entry in `res`
                    res.forEach((resItem) => {
                        if (resItem.RowStatus != 'REFERENCE') {
                            referenceGuid = resItem.CrfAttachmentsGuid || "";
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
                    if (this.isEmpty(item.QuestionToUserName)) {
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
            ValidateUserOnSaveAssign: function (UserAssign) {
                let isValidUserAssign = true;
                for (let index = 0; index < UserAssign.length; index++) {
                    const item = UserAssign[index];
                    if (
                        this.isEmpty(item.DepartmentName) ||
                        this.isEmpty(item.UserName)
                    ) {
                        MessageToast.show('Please Fill Mandatory Columns for PDRM Meeting');
                        isValidUserAssign = false;
                        break;
                    }
                }
                return isValidUserAssign;
            },
            ValidateUserAssign: function (UserAssign) {
                let isValidUserAssign = true;
                for (let index = 0; index < UserAssign.length; index++) {
                    const item = UserAssign[index];
                    if (
                        this.isEmpty(item.DepartmentName) ||
                        this.isEmpty(item.UserName) ||
                        this.isEmpty(item.MeetingStartDate) ||
                        this.isEmpty(item.MeetingEndDate)
                    ) {
                        MessageToast.show('Please Fill Mandatory Columns for PDRM Meeting');
                        isValidUserAssign = false;
                        break;
                    }

                    if (this.isEmpty(item.UserAvailable)) {
                        MessageToast.show('Please check availability for users');
                        isValidUserAssign = false;
                        break;
                    }

                    if (item.UserAvailable === 'Not Available' && item.IsMeetingAttended === 'Y') {
                        MessageToast.show('Meeting can not be attended without user availability');
                        isValidUserAssign = false;
                        break;
                    }

                    if (item.UserAvailable === 'Not Available' && item.CallMeeting === 'Y') {
                        MessageToast.show('Meeting can not be called without user availability');
                        isValidUserAssign = false;
                        break;
                    }

                    if (saveorsubmit === 'SUBMIT') {
                        const inputDate = item.MeetingEndDate;//"17-04-2025, 04:30 PM";
                        // Split the date and time
                        const [datePart, timePart] = inputDate.split(", ");
                        const [day, month, year] = datePart.split("-").map(Number);

                        // Convert 12-hour time to 24-hour time
                        let [time, meridian] = timePart.split(" ");
                        let [hours, minutes] = time.split(":").map(Number);

                        if (meridian === "PM" && hours !== 12) {
                            hours += 12;
                        }
                        if (meridian === "AM" && hours === 12) {
                            hours = 0;
                        }

                        // Create the date object (Note: month is 0-based in JS)
                        const inputDateTime = new Date(year, month - 1, day, hours, minutes);
                        const now = new Date();
                        if (inputDateTime > now) {
                            MessageToast.show('A meeting is scheduled for a future date and time. You cannot submit the CRF form at this moment. Please use the Save option instead.');
                            isValidUserAssign = false;
                            break;
                        }
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

            ValidateApprovalAttachment: function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oDataRes = oModel.getData();
                let oDataProgress = oModel.getProperty('/ApprovalTransaction');
                let oDataAttachment = oModel.getProperty('/InspDraw');
                let isValidInspDraw = true;
                const lastIndex = oDataAttachment.length - 1; // Calculate the last index
                const lastElement = oDataAttachment[lastIndex]; // Access the last element
                console.log(lastElement)
                let oData = oModel.getData();
                const filteredTransactions = oDataProgress.filter(
                    transaction => transaction.Stage_StageGuid === oData.Stage_StageGuid
                );
                const filteredData = filteredTransactions[0].DataFlow.filter(item => item.User_UserGuid === LoginInfo.UserID);
                const userTypeArray = filteredData[0].UserType.split("");
                if (lastElement.RowStatus === 'CLOSED' && (userTypeArray[1] == '1' || (userTypeArray[2] == '1' && oDataRes.ApprovalStatus == 'APPROVED') || (userTypeArray[3] == '1' && oDataRes.ApprovalStatus == 'REJECTED'))) {
                    isValidInspDraw = false;
                    MessageToast.show('Please Select Attachment');
                    return
                }
                return isValidInspDraw;

            },

            ValidateInspAttachment: function (InspDraw) {
                let isValidInspDraw = true;
                if (InspDraw.length === 0) {
                    isValidInspDraw = false;
                    MessageToast.show('Please Select Attachment');
                    return
                }
                return isValidInspDraw;
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

            onUploadPressSeekAdvice: async function () {
                const oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const oData = oModel.getData();

                // Validate the SeekAdvice data
                if (this.ValidateSeekAdvice(oData.SeekAdvice)) {
                    let oPayload = [];
                    let aBase64Files = [];
                    const oResponseModel = this.getView().getModel("AttachmentRefModel");
                    let oDataAttachRes = oResponseModel.getData();
                    const enumSeekAdvice = oDataAttachRes.value[0].EnumCode
                    // Consolidate all attachments from the SeekAdvice table
                    oData.SeekAdvice.forEach((row) => {
                        if (row.Attachment && Array.isArray(row.Attachment)) {
                            aBase64Files = aBase64Files.concat(row.Attachment.map((file) => ({
                                AttachmentGuId: null,
                                AttachmentName: file.AttachmentName,
                                OrgFileName: file.AttachmentName.split(".")[0],
                                OrgFileExtension: file.OrgFileExtension,
                                SysFileName: "",
                                SysFileExtension: file.OrgFileExtension,
                                ReferenceType: enumSeekAdvice,
                                ReferenceId: null,
                                ReferenceGuid: "",
                                SysFilePath: "",
                                Base64File: file.fileBase64,
                            })));
                        }
                    });

                    // Build the payload
                    if (aBase64Files.length > 0) {
                        oPayload = { AttachmentData: aBase64Files };

                        try {
                            // Send API request
                            await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DAttachments", oPayload, "seekAttachResModel");

                            // Update the model after a successful API call
                            const seekAttachModel = this.getView().getModel("seekAttachResModel");
                            const responseData = seekAttachModel.getData();
                            console.log("Upload successful:", responseData);

                            // Save the SeekAdvice
                            this.onSaveSeekAdvice();
                        } catch (error) {
                            console.error("Error during upload:", error);
                        }
                    } else {
                        // No attachments to upload, save the SeekAdvice directly
                        this.onSaveSeekAdvice();
                    }
                }
            },



            onSaveSeekAdvice: async function () {
                let srcObject = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let trgObject = this.getView().getModel('SeekAdviceModel').getData();

                trgObject.CrfReqGuid = this.getListViewEditPropertyValue();
                this.transferObjectValues(srcObject, trgObject);
                trgObject.CrfReqNo = srcObject.CrfReqNo;
                trgObject.loginUserID_UserGuid = LoginInfo.UserID;
                trgObject.SaveOrSubmit = "SeekAdvice";
                trgObject.SeekAdvice.forEach((item) => {
                    item.QuestionFromUserName = LoginInfo.Username
                    item.QuestionFromUser_UserGuid = LoginInfo.UserID
                    item.Parent_CrfReqGuid = srcObject.CrfReqGuid
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
                await this.createNewModelUsingAPI(
                    'PATCH',
                    '/odata/v4/stoneman-crf/TCrfHeader' + `(${this.getListViewEditPropertyValue()})`,
                    trgObject,
                    'seekAttachModel'
                );
                const res = this.getApiResponseObject();
                if (res.success) {
                    await this.createNewModelUsingAPI(
                        "GET",
                        '/odata/v4/stoneman-crf/TCrfHeader(' + this.getListViewEditPropertyValue() + ')?$expand=SeekAdvice($expand=QuestionToUser,Attachment,Role,QuestionFromUser$filter=DelMark eq 0)',
                        "",
                        "SeekResModel"
                    );
                    const seekResponse = this.getView().getModel("SeekResModel");
                    let seekData = seekResponse.getData();
                    console.log(seekData)
                    await this.onUpdateAttachmentSeekData(seekData.SeekAdvice);
                    MessageToast.show('Seek Advice Save Successfully ' + seekData.CrfReqNo);
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

            handleBeforeSelectionMeetingDate: function () {
                isGetUseravailabilityClicked = false;
            },

            getMeetingDate: function (oEvent) {
                let formatedDate;
                let sSelectedDate = oEvent.getParameter("value"); // Get the selected value
                let oDatePicker = oEvent.getSource();
                let today = new Date();
                let selectedDate = new Date(sSelectedDate);
                // Reset the time to 00:00:00 for both dates
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
                // Check if the selected date is in the future
                if (selectedDate < today) {
                    MessageToast.show("Past Date is not allowed.");
                    oDatePicker.setValue("");
                } else {
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

                            if (isGetUseravailabilityClicked === false) {
                                item.UserAvailable = null;
                            }
                        });

                        oViewModel.setProperty('/UserAssign', aTableData);
                    }
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

                    this.resetAvailability();
                }
                this.getMeetingDate(oEvent);
            },

            resetAvailability: function () {
                var oViewModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var aTableData = oViewModel.getProperty('/UserAssign');
                if (aTableData && aTableData.length > 0) {
                    aTableData.forEach(function (item) {
                        item.UserAvailable = null;
                    });

                    oViewModel.setProperty('/UserAssign', aTableData);
                }
            },

            getAvailableUsers: async function (oEvent) {
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
                    '/odata/v4/stoneman-crf/PDRM_Check_UserAvailability',
                    trgObject,
                    'UserResModel'
                );
                let myModel = this.getView().getModel('UserResModel');
                let datamodel = myModel.getData();
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
                    // oViewModel.setProperty(`/UserAssign`, aTableData);
                    oViewModel.setProperty(`/UserAssign/UserAvailable`, aTableData.UserAvailable);
                }

                isGetUseravailabilityClicked = true;
                this.getMeetingDate(oEvent);
            },

            findDuplicateEntries: function (arr) {
                var seen = {}; // To track unique combinations of MCatCode and MCatName
                var duplicates = []; // To store duplicates

                arr.forEach(function (item) {
                    var userId = item.UserID_UserGuid;

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

            enableDisableViewBtn: function (data) {
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

            setMaterialName: function (aData) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                let dataRes = aData.getData();
                oData.Material.forEach(function (item) {
                    item.MaterialAutoCode = (dataRes.MCatName === null ? '' : dataRes.MCatName)
                })
                oData.Team.forEach(function (item) {
                    item.ProductCatName = (dataRes.ProductCatName === null ? '' : dataRes.ProductCatName)
                    item.MaterialCategory = (dataRes.MCatName === null ? '' : dataRes.MCatName)
                })
                oModel.setData(oData);
            },

            onSelectLightning: async function () {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                const prodCatList = await this.getProductCatListForLighting()
                if (prodCatList.includes(oData.ProductCatName)) {
                    // this.byId('lightingHolder').setVisible(true);
                    // this.byId('lightingShape').setVisible(true);
                    // this.byId('lightingCord').setVisible(true);
                    this.byId('lightingCountry').setVisible(true);
                    this.getHolderData();
                    this.getShapeData();
                    this.getCordData();
                } else {
                    // this.byId('lightingHolder').setVisible(false);
                    // this.byId('lightingShape').setVisible(false);
                    // this.byId('lightingCord').setVisible(false);
                    this.byId('lightingCountry').setVisible(false);
                }
            },

            onSelectProdCatAndMatCat: function () {
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var oData = oModel.getData();
                oData.CategoryCode = oData.ProductCatCode === null ? '' : oData.ProductCatCode;
                oModel.setData(oData);
            },

            getBuyerBrandData: async function (buyerGUID) {
                await this.createNewModelUsingAPI(
                    "GET",
                    `/odata/v4/stoneman-crf/CBuyerBrand?$filter=DelMark eq 0 and Parent_BuyerGuid eq ${buyerGUID}`,
                    "",
                    "buyerBrandModel"
                );
                const brandResponse = this.getView().getModel("buyerBrandModel");
                let aData = brandResponse.getData();
                let brandData = aData.value;
                let oBrandModel = this.getView().getModel("ReqTypeModel");
                oBrandModel.setProperty("/Brand", brandData);
            },

            getCadLevelData: async function () {
                await this.createNewModelUsingAPI(
                    "GET",
                    `/odata/v4/stoneman-crf/MEnum?$filter=EnumType eq 'CAD_Level'`,
                    "",
                    "cadLevelModel"
                );
                const cadLevelResponse = this.getView().getModel("cadLevelModel");
                let aData = cadLevelResponse.getData();
                let cadLevelData = aData.value;
                let oCADLevelModel = this.getView().getModel("ReqTypeModel");
                oCADLevelModel.setProperty("/CadLevel", cadLevelData);

            },

            onBrandChange: function (oEvent) {
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const oSelectedItem = oEvent.getParameter("selectedItem");
                const sSelectedKey = oSelectedItem.getKey();
                const oBrandModel = this.getView().getModel("ReqTypeModel");
                const aData = oBrandModel.getProperty("/Brand");

                const oSelectedData = aData.find(item => item.BuyerBrandGuid === sSelectedKey);

                if (oSelectedData) {
                    oModel.setProperty('/Brand_BuyerBrandGuid', oSelectedData.BuyerBrandGuid);
                    oModel.setProperty('/BrandName', oSelectedData.BrandName);
                    oModel.setProperty('/BrandCode', oSelectedData.BrandCode);
                } else {
                    sap.m.MessageToast.show("No matching data found.");
                }
            },

            subscribeFragment: async function () {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.subscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);
            },

            openAttachmentDialog: function (oEvent) {
                this.subscribeFragment();
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();
                // Determine if the dialog should be cleared
                const isAddNewButton = sButtonId.includes('CRF_addAttachBtnNew');
                // Create the JSONModel
                let oModelAttachAdd = this.getView().getModel('AttachModel');
                let oDataAttachAdd = oModelAttachAdd.getData();

                let oMainAttachment = this.getView().getModel(this.getEntryFormDataSourceModelName())
                let oDataAttach = oMainAttachment.getProperty("/InspDraw");
                const alreadyuser = oDataAttach.some((ele) => ele.User_UserGuid == RoleInfo.UserID && ele.RowStatus !== "REFERENCE")
                if (alreadyuser && isAddNewButton) {
                    sap.m.MessageToast.show(
                        "Please Select New Attachment! Can't Add New Attachment for Same User. Added to your existing row."
                    );
                    return;
                }
                oDataAttachAdd.isButtonEnabled = false;

                const filterData = oDataAttach.filter((ele) => ele.RowStatus == 'OPEN')
                if (isAddNewButton) {

                    // Clear existing data for Add New button
                    oModelAttachAdd.setData({ Attachments: filterData[0]?.Attachment, isButtonEnabled: false });
                    // this._oDialog1.setModel(oModelAttachAdd, 'AttachModel');
                }
                else if (sButtonId.includes('attachFileViewBtn')) {

                    let oBindingContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());
                    let sPath = oBindingContext.getPath(); // e.g., "/InspDraw/0"
                    //  this.iRowAttachmentIndex = parseInt(sPath.split("/").pop(), 10); // Extract the last part of the path as index
                    this.iRowAttachmentIndex = sPath.split('/').pop();

                    let oModelAttachFile = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    let oDataAttachFile = oModelAttachFile.getProperty("/InspDraw");

                    // Populate data for View File button
                    let attachments = oDataAttachFile[this.iRowAttachmentIndex]?.Attachment || []; // Fetch attachments
                    let rowStatus = oDataAttachFile[this.iRowAttachmentIndex]?.RowStatus;
                    oDataAttachAdd.Attachments = attachments.map((item) => ({
                        AttachmentName: item.AttachmentName || null,
                        OrgFileExtension: item.OrgFileExtension || null, // Set fileType from OrgFileExtension if required
                        AttachmentGuId: item.AttachmentGuId || null, // Set fileType from OrgFileExtension if required
                        fileBase64: item.fileBase64 || null,
                        IsDeleteable: !(rowStatus === 'REFERENCE' || rowStatus === 'CLOSED')
                    }));
                    oModelAttachAdd.setData(oDataAttachAdd);
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


                // ✅ Set model freshly each time
                this._oDialog1.setModel(oModelAttachAdd, "AttachModel");

                this._oDialog1.open();

            },

            onSaveAttachmentData: function (oEvent) {
                // Get dialog model data
                const oDialogModel = this._oDialog1.getModel("AttachModel");
                const oData = oDialogModel.getData();
                //let oFileAttachUploader = this.byId('fileUploadTable');

                // Main model and data
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let aData = oMainModel.getProperty("/InspDraw") || []; // Ensure it's an array
                const oMainData = oMainModel.getData();
                const hasOpenRowForUser = () =>
                    aData.findIndex(r => r.User_UserGuid === RoleInfo.UserID && r.RowStatus === "OPEN");
                // Helper function to create a new row
                const createNewRow = () => ({
                    RowNumber: aData.length + 1,
                    ApprovalStatus: "NA",
                    AttachmentRemarks: oMainData.AttachmentRemarks,
                    CrfAttachmentsGuid: null,
                    DelMark: 0,
                    Parent_CrfReqGuid: null,
                    Remarks: null,
                    RowStatus: "OPEN",
                    StageCode: oMainData.CrfStageCode,
                    RoleName: RoleInfo.RoleName,
                    UserName: LoginInfo.Username,
                    Stage_StageGuid: oMainData.Stage_StageGuid,
                    User_UserGuid: RoleInfo.UserID,
                    Attachment: oData.Attachments,
                });
                const iUserRow = hasOpenRowForUser();
                if (iUserRow === -1) {
                    // no row yet -> add one
                    aData.push(createNewRow());
                    oMainModel.setProperty("/InspDraw", aData);
                    this._oDialog1.close();
                    return;
                }
                const newAttachments = oData.Attachments || [];

                // Merge both arrays
                aData[iUserRow].Attachment = newAttachments;

                // Optional: update remarks or metadata
                aData[iUserRow].AttachmentRemarks = oMainData.AttachmentRemarks;

                oMainModel.setProperty("/InspDraw", aData);
                oMainModel.refresh(true);
                console.log("Updated data:", aData);

                // Close the dialog
                this._oDialog1.close();
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


            onCloseAttachmentDialog: function () {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.unsubscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);

                if (this._oDialog1) {
                    this._oDialog1.close();
                    this._oDialog1.destroy();
                    this._oDialog1 = undefined;
                }
            },

            onAttachmentUpdate: function (sChannel, sEvent, oData) {
                console.log("Attachment Updated:", oData);
                // Handle the event
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
            onClearFileUploader: function () {
                var oFileUploader = this.byId("fileUploadTable");
                oFileUploader.clear();
            },
            onFileChangeDialog: function (oEvent) {
                let oButton = oEvent.getSource();
                let sButtonId = oButton.getId();
                // Determine if the dialog should be cleared
                const isSeekButton = sButtonId.includes('fileUploadSeekTable');
                //let oFileAttachUploader = this.byId('fileUploadTable');

                let oFileSeekUploader = this.byId('fileUploadSeekTable');
                const aFiles = oEvent.getParameter("files"); // Get selected files
                let oModel = this.getView().getModel("AttachModel");
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
                            // Push file details and base64 string into the model data
                            this._aBase64FilesMultiple.push({
                                AttachmentName: file.name,
                                OrgFileExtension: file.name.split('.').pop(),
                                //fileSize: (file.size / 1024).toFixed(2), // Convert to KB
                                fileBase64: base64, // Base64 encoded string
                            });

                            // Update the model once all files are processed
                            oModel.setProperty("/Attachments", this._aBase64FilesMultiple);
                            oModel.setProperty("/isButtonEnabled", this._aBase64FilesMultiple.length > 0);
                            oModel.refresh(true);
                        });
                    });
                } else {
                    sap.m.MessageToast.show("No file selected");
                }
                if (isSeekButton) {
                    oFileSeekUploader.clear();
                }
                //  else {
                //     oFileAttachUploader.clear();
                // }



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

                // Process the selected attachment
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

                // Validate
                if (!oSelectedAttachment || !oSelectedAttachment.AttachmentGuId) {
                    MessageToast.show("Invalid or missing attachment data.");
                    return;
                }

                // Prepare payload
                let payload = {
                    ID: oSelectedAttachment.AttachmentGuId
                };

                // Call API
                await this.createNewModelUsingAPI(
                    "POST",
                    "/odata/v4/stoneman-attachment/DGetAttachmentDataWithFile",
                    payload,
                    "viewAttachModel"
                );

                const res = this.getApiResponseObject();

                if (res.success) {
                    this.displayAttachment(res.object.value);
                } else {
                    MessageToast.show(
                        res.object?.responseJSON?.error?.message ||
                        "Failed to retrieve attachment data."
                    );
                }

                // let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");
                // let oSelectedAttachment = oBindingContext.getObject();
                // if (!oSelectedAttachment || !oSelectedAttachment.AttachmentGuId) {
                //     MessageToast.show("Invalid or missing attachment data.");
                //     return;
                // }

                // // Proceed with the selected attachment
                // let payload = {
                //     ID: oSelectedAttachment.AttachmentGuId
                // };
                // await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-attachment/DGetAttachmentDataWithFile", payload, "viewAttachModel");
                // const res = this.getApiResponseObject();

                // if (res.success) {
                //     this.displayAttachment(res.object.value);
                // } else {
                //     MessageToast.show(res.object.responseJSON.error.message || "Failed to retrieve attachment data.");
                // }
            },

            onViewFileSeek: async function (oEvent) {
                await this.onViewFileHandler(oEvent, "/SeekAdvice");
            },

            onViewFile: async function (oEvent) {
                await this.onViewFileHandler(oEvent, "/InspDraw");
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
                    var oPDFViewer = new PDFViewer();
                    this.getView().addDependent(oPDFViewer);
                    oPDFViewer.setSource(sBlobUrl);
                    oPDFViewer.open();
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



            onDownloadFileHandler: async function (oEvent, modelPath) {

                let oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oDataInspDraw = oMainModel.getProperty(modelPath);
                let oAttachmentArray = oDataInspDraw?.[this.iRowAttachmentIndex]?.Attachment || oDataInspDraw?.Attachment;
                if (!oAttachmentArray || oAttachmentArray.length === 0) {
                    MessageToast.show("No attachments available.");
                    return;
                }

                // Process the selected attachment

                // let oBindingContext = oEvent.getSource().getBindingContext("AttachModel");
                // let oSelectedAttachment = oBindingContext.getObject();
                // if (!oSelectedAttachment || !oSelectedAttachment.AttachmentGuId) {
                //     MessageToast.show("Invalid or missing attachment data.");
                //     return;
                // }


                // Process the selected attachment
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

                // Validate
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
                aLink.download = actualFileName; // Assuming file extension is part of sFileType
                aLink.click();
                MessageToast.show('File downloaded successfully.');
            },

            onDownloadFileSeek: async function (oEvent) {
                await this.onDownloadFileHandler(oEvent, "/SeekAdvice");
            },

            onDownloadFile: async function (oEvent) {
                await this.onDownloadFileHandler(oEvent, "/InspDraw");
            },

            // openTeamDialog: async function () {

            //     if (!this._oDialog) {
            //         let oTeamModel = this.getView().getModel("teamModel");
            //         let oTeamData = oTeamModel.getData();
            //         // Add a `select` property to each object
            //         oTeamData.value = oTeamData.value.map((item) => {
            //             return {
            //                 ...item,      // Spread the existing properties
            //                 Selected: item.Selected || false // Add the new property with a default value
            //             };
            //         });
            //         oTeamModel.setData(oTeamData);
            //         this._oDialog = sap.ui.xmlfragment(this.getView().getId(), "modone.fragment.crffragment.TeamUserSelection", this);
            //         this.getView().addDependent(this._oDialog);
            //         oTeamModel.attachRequestCompleted(function (oEvent) {
            //             if (!oEvent.getParameter("success")) {
            //                 console.error("Failed to load items.json");
            //             }
            //         });
            //         // Bind current selected rows to the dialog model
            //         this.aSelectedRows = this.aSelectedRows || [];
            //         let aData = oTeamModel.getProperty("/value");

            //         // Mark rows as selected if they are already in the global selection
            //         aData.forEach(row => {
            //             row.Selected = this.aSelectedRows.filter(selectedRow => selectedRow.User_UserGuid === row.USERGUID);
            //         });

            //         this._oDialog.setModel(oTeamModel, 'teamModel');
            //     }
            //     this._oDialog.open();

            // },


            openTeamDialog: async function () {
                // Check if the dialog is already created
                // Fetch the team model and data
                let oTeamData;
                let oTeamModel = this.getView().getModel("teamModel");
                oTeamData = oTeamModel !== undefined ? oTeamModel.getData() : undefined;
                if (oTeamData === undefined || oTeamData === null) {
                    await this.getTeamUser();
                    oTeamModel = this.getView().getModel("teamModel");
                    oTeamData = oTeamModel.getData();
                } else {
                    oTeamData = oTeamModel.getData();
                }

                let resRepeatModel = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                if (resRepeatModel.ReqTyp === 'R') {
                    // Add a `Selected` property to each item if not present
                    oTeamData.value.forEach(element => {
                        //User_UserGuid
                        let filterData = resRepeatModel.Team.filter(item => item.User_UserGuid === element.USERGUID);
                        if (filterData.length > 0) {
                            element.Selected = true;
                        }
                    });
                } else {
                    // Add a `Selected` property to each item if not present
                    oTeamData.value = oTeamData.value.map(item => ({
                        ...item, // Spread existing properties
                        Selected: item.Selected || false // Default to false if not already set
                    }));
                }

                oTeamModel.setData(oTeamData);

                oTeamModel.attachRequestCompleted(function (oEvent) {
                    if (!oEvent.getParameter("success")) {
                        console.error("Failed to load items.json");
                    }
                });

                if (!this._oDialog) {

                    // Create the dialog if it doesn't exist
                    this._oDialog = sap.ui.xmlfragment(
                        this.getView().getId(),
                        "modone.fragment.crffragment.TeamUserSelection",
                        this
                    );
                    this.getView().addDependent(this._oDialog);
                }

                // Handle Edit mode to show selected rows
                if (formMode === '2') { // Edit mode
                    let oTeamModel = this.getView().getModel("teamModel");
                    let oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                    let aSelectedFromApi = oMainModel.getProperty("/Team"); // Assuming the API provides selected users

                    // Map the selected rows based on UserGUID
                    let aData = oTeamModel.getProperty("/value");
                    aData.forEach(row => {
                        row.Selected = !!aSelectedFromApi.find(selectedRow => selectedRow.User_UserGuid === row.USERGUID);
                    });

                    // Update the model to reflect selected rows
                    oTeamModel.setProperty("/value", aData);
                }

                // Open the dialog
                this._oDialog.open();
            },

            clearTeamFragmentData: async function () {
                if (this._oDialog) {
                    this._oDialog.destroy();
                    this._oDialog = undefined; // Clear the reference
                }
                let oModelTeamAdd = this.getView().getModel('teamModel');
                if (oModelTeamAdd) {
                    oModelTeamAdd.setData({ value: [] }); // Reset to empty state
                }
            },

            onCheckBoxSelect: function (oEvent) {
                const bSelected = oEvent.getParameter("selected");
                const oContext = oEvent.getSource().getBindingContext("teamModel");
                const oRowData = oContext.getObject();

                let entryFormModelData = this.getView().getModel(this.getEntryFormDataSourceModelName()).getData();
                let tempArr = [];
                entryFormModelData.ApprovalTransaction.forEach(element => {
                    tempArr.push(...element.DataFlow);
                });

                // Prevent unchecking rows that are already selected initially
                if (RoleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR) {

                    let checkForUserGuid = tempArr.some(row => row.User_UserGuid === oRowData.USERGUID && row.RowStatus !== "NA");
                    // let checkForRowStatus = tempArr.some(row => row.RowStatus !== "NA");
                    if (!bSelected && checkForUserGuid
                        /*this.aSelectedRows.some(row => row.User_UserGuid === oRowData.USERGUID)*/) {
                        MessageToast.show("This row cannot be deselected as it is already part of the existing selection.");
                        oEvent.getSource().setSelected(true); // Revert the checkbox to checked state
                        return;
                    }
                }
                oRowData.Selected = bSelected;
                oContext.getModel().refresh();
            },

            onSelectAllCheckBox: function (oEvent) {
                const bSelected = oEvent.getParameter("selected");
                const oModel = this.getView().getModel("teamModel");
                const aItems = oModel.getProperty("/value");

                aItems.forEach((item) => {
                    item.Selected = bSelected;
                });

                oModel.refresh(); // Refresh the model to reflect changes in the UI
            },

            onTeamClose: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    // this._oDialog.destroy();
                    // this._oDialog = undefined;
                }
            },

            onSaveTeamData: function () {

                this.aSelectedRows = [];
                const oFragmentModel = this.getView().getModel("teamModel");
                const aItems = oFragmentModel.getProperty("/value");
                let aSelectedInDialog = aItems.filter(row => row.Selected);

                if (!Array.isArray(this.aSelectedRows)) {
                    this.aSelectedRows = [];
                }

                // Merge new selections with the global selection
                aSelectedInDialog.forEach(item => {
                    if (!this.aSelectedRows.some(existingRow => existingRow.User_UserGuid === item.USERGUID)) {
                        const transformedData = {
                            CrfTeamGuid: null,
                            RowNumber: item.RowNumber || null,
                            DelMark: 0,
                            Parent_CrfReqGuid: null,
                            RoleCode: item.USERROLECODE || null,
                            RoleGuid_RoleGuid: item.ROLE_ROLEGUID || null,
                            RoleName: item.USERROLENAME, // Set to null as no mapping exists in the input
                            UserMaterialCategoryCode: item.MATERIALCATEGORYCODE || null,
                            UserMaterialCategoryName: item.MATERIALCATEGORYNAME || null,
                            ProductCategoryCode: item.PRODUCTCATEGORYCODE || null,
                            ProductCategoryName: item.PRODUCTCATEGORYNAME || null,
                            UserName: item.USERNAME || null,
                            User_UserGuid: item.USERGUID || null,
                            DepartmentCode: item.DEPARTMENTCODE || null,
                            DepartmentName: item.DEPARTMENTNAME || null,
                            SubDepartmentCode: item.SUBDEPARTMENTCODE || null,
                            SubDepartmentName: item.SUBDEPARTMENTNAME || null
                        };
                        this.aSelectedRows.push(transformedData);
                    }
                });
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                this.aSelectedRows.forEach((item, index) => {
                    item.RowNumber = index + 1; // Start row numbering from 1
                });
                oMainModel.setProperty("/Team", this.aSelectedRows);

                //when pdcordinator login - add new selected teams to meeting
                this.addTeamToMeeting(oMainModel);

                this.onTeamClose();

            },

            addTeamToMeeting: function (oMainModel) {
                let oData = oMainModel.getData();

                //check for select team members already exists in meeting
                //if not then only add to meeting
                oData.Team.forEach(element => {
                    let filterData = oData.UserAssign.filter(item => item.UserID_UserGuid === element.User_UserGuid);

                    if (filterData.length === 0) {
                        var newRow = {
                            CallMeeting: 'Y',
                            CrfUserAttachmentAbsId_AbsId: null,
                            DepartmentName: element.DepartmentCode,//element.SubDepartmentName,
                            DepartmentCode: element.DepartmentName,//element.SubDepartmentCode,
                            IsMeetingAttended: null,
                            Remarks: null,
                            UserID_UserGuid: element.User_UserGuid,
                            UserCode: null,
                            UserName: element.UserName,
                            UserEmailId: null,
                            DepartmentID: null,
                            RowNumber: 0,
                            isEditable: true,
                            MeetingStartDate: oData.UserAssign.length !== 0 ? oData.UserAssign[0].MeetingStartDate : null,
                            MeetingEndDate: oData.UserAssign.length !== 0 ? oData.UserAssign[0].MeetingEndDate : null,
                            CrfReqID_CrfReqUUID: this.getListViewEditPropertyValue(),
                            UserAvailable: null
                        };
                        this.addRowInObj('UserAssign', newRow, 'RowNumber');
                    }
                });
            },

            getTeamUser: async function () {

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                var body = {
                    BUYERCODE: oData.BuyerCode,
                    PRODCATEGORYGUID: null,
                    CRFSTPRODCATEGORYCODE: oData.ProductCatCode,
                    MATERIALCATEGORYCODE: oData.MCatCode
                };
                if (oData.Team.length === 0) {
                    body.STAGECODE = 1;
                    body.TEMPLATEGUID = oData.Template_TemplateGuid;
                } else {
                    body.STAGECODE = 0;
                    body.TEMPLATEGUID = oData.Template_TemplateGuid;
                }
                await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-crf/getUSPUsersForSelectionOnCrf', body, 'teamModel');
                let myTeamModel = this.getView().getModel('teamModel');
                let teamData = myTeamModel.getData();

                if (formMode === "3") {
                    teamData.value.map(function (x) {
                        x.Selected = x.IsSelected;
                    });
                }

                console.log(teamData);

            },

            getTemplateData: async function () {

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                var body = {

                    "MenuSubType": oData.CrfCategory,
                    "MenuCode": "CRF"

                };
                await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-crf/GetTemplate', body, 'templateModel');
                let myModel = this.getView().getModel('templateModel');
                let templateRes = myModel.getData();
                let tempData = templateRes.value.filter(item => item.STAGECODE === 'CRF_FORMFILL');
                oModel.setProperty('/CrfStageCode', tempData[0].STAGECODE)
                oModel.setProperty('/CrfStageName', tempData[0].STAGENAME)
                oModel.setProperty('/Template_TemplateGuid', tempData[0].TEMPLATEGUID)
                oModel.setProperty('/CrfStatus', 'New')
                oModel.setProperty('/ApprovalStatus', 'NA')
            },

            getTemplateDataForEnableDisable: async function () {

                var body = {

                    "MenuSubType": "CAD",
                    "MenuCode": "CRF"

                };
                await this.createNewModelUsingAPI('POST', '/odata/v4/stoneman-crf/GetTemplate', body, 'templateModel');
                let myModel = this.getView().getModel('templateModel');
                let templateRes = myModel.getData();
                let tempData = templateRes.value.filter(item => item.STAGECODE === 'CRF_FORMFILL');
                this.getEnableDisableAPIFun(tempData[0].STAGEGUID);

            },

            getExchangeRate: async function () {

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                const oDate = new Date();
                const sFormattedDateTime = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}-${String(oDate.getDate()).padStart(2, '0')}T00:00:00`;
                console.log(sFormattedDateTime); // Example: "2024-12-26T14:30:00"
                await this.createNewModelUsingAPI('GET', `/sap/opu/odata/sap/YY1_CURRENCYRATE_CDS/YY1_CurrencyRate(ExchangeRateType='M',SourceCurrency='${oData.BuyerCur}',TargetCurrency='INR',ExchangeRateEffectiveDate=datetime'${sFormattedDateTime}')`, '', 'exchangeModel');
                let myModel = this.getView().getModel('exchangeModel');

                if (oData.BuyerCur === 'INR' || myModel === undefined) {
                    oModel.setProperty('/ExchRate', 0);
                } else {
                    let datamodel = myModel.getData();
                    if (datamodel) {
                        let exchRate = parseFloat(datamodel.d.ExchangeRate);
                        oModel.setProperty('/ExchRate', parseFloat(exchRate).toFixed(2));
                    }
                }
            },

            onInputLiveChange: function (oEvent) {

                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oData = oModel.getData();
                const sValue = oEvent.getParameter("value");
                const Result = (sValue * oData.ExchRate) * 100;
                const oEstimCost = this.byId("estimCostCurr");
                oEstimCost.setValue(isNaN(Result) ? 0 : Result.toFixed(2)); // Handle non-numeric input gracefully

            },

            onFieldChange: function (oEvent) {
                // Get the row context
                var oInput = oEvent.getSource();
                var oContext = oInput.getBindingContext(this.getEntryFormDataSourceModelName());
                var oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                var sPath = oContext.getPath();

                // Get the current row data
                var oRowData = oModel.getProperty(sPath);
                const sValueQuestion = oEvent.getParameter("value");
                const sValueAnswer = oEvent.getParameter("value");
                var sQueryInput = sValueQuestion.trim();
                var sReply = sValueAnswer.trim();

                // Update enabled/disabled states
                if (sQueryInput) {
                    oModel.setProperty(sPath + "/isReplyEnabled", false);
                    oModel.setProperty(sPath + "/isQueryInputEnabled", true);
                } else if (sReply) {
                    oModel.setProperty(sPath + "/isQueryInputEnabled", false);
                    oModel.setProperty(sPath + "/isReplyEnabled", true);
                } else {
                    // Reset to default when both are empty
                    oModel.setProperty(sPath + "/isQueryInputEnabled", true);
                    oModel.setProperty(sPath + "/isReplyEnabled", true);
                }
            },

            enableDisableSeekAdvice: function (aData) {
                var view = this.getView();
                var oTable = view.byId('seekAdviceTable'); // Get the table by its ID
                if (oTable) {
                    var aItems = oTable.getItems(); // Get the items (rows) of the table
                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells(); // Get the cells (columns) of each row
                        oCells.forEach(function (item) {
                            var sControlId = item.getId();
                            sControlId = sControlId.replace('seekAdviceTable-0', '');
                            var controlState = aData.find(function (controlItem) {
                                return sControlId.includes(controlItem.CONTROLID);
                            });

                            if (controlState && typeof item.setEnabled === 'function') {
                                item.setEnabled(controlState.ENABLED);
                            }
                        });
                    });
                }
            },

            onPressBack: function () {
                this.clearAttachmentFragmentData();
                this.clearTeamFragmentData();
                this.onPressOfEntryFormCancelButton();
            },

            openSeekAttachmentDialog: function (oEvent) {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.subscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);

                if (!this._oDialogSeek) {
                    // Create and load the fragment if it doesn't already exist
                    this._oDialogSeek = sap.ui.xmlfragment(
                        this.getView().getId(),
                        "modone.fragment.crffragment.SeekAdviceAttachment",
                        this
                    );
                    this.getView().addDependent(this._oDialogSeek);
                }

                // Initialize models
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const oAttachModel = this.getView().getModel("AttachModel");
                const oAttachData = oAttachModel.getData();

                // Get the selected table row index
                const oBindingContext = oEvent.getSource().getBindingContext(this.getEntryFormDataSourceModelName());
                const sPath = oBindingContext.getPath(); // e.g., "/SeekAdvice/0"
                this.iRowAttachmentIndex = parseInt(sPath.split("/").pop(), 10);

                // Retrieve the attachments for the selected row
                const oTableData = oMainModel.getProperty("/SeekAdvice");
                const aAttachments = oTableData[this.iRowAttachmentIndex]?.Attachment || [];

                // Map the attachments into the model structure
                oAttachData.Attachments = aAttachments.map((item) => ({
                    AttachmentName: item.AttachmentName || null,
                    OrgFileExtension: item.OrgFileExtension || null,
                    AttachmentGuId: item.AttachmentGuId || null,
                }));

                // Update the AttachModel with the new attachments
                oAttachModel.setData(oAttachData);

                // Set the model for the dialog and open it
                this._oDialogSeek.setModel(oAttachModel, "AttachModel");
                this._oDialogSeek.open();
            },


            onSaveSeekAttachmentData: function () {
                // Get dialog model data
                const oDialogModel = this._oDialogSeek.getModel("AttachModel");
                const oDialogData = oDialogModel.getData();

                // Retrieve the main model and its data
                const oMainModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                const aSeekAdvice = oMainModel.getProperty("/SeekAdvice");

                // Check if the row index is already set
                if (this.iRowAttachmentIndex !== undefined && aSeekAdvice[this.iRowAttachmentIndex]) {

                    aSeekAdvice[this.iRowAttachmentIndex].Attachment = [...(oDialogData.Attachments || []),
                    ];

                    const oModelAttach = this.getView().getModel("AttachModel");
                    oModelAttach.setData({
                        Attachments: aSeekAdvice[this.iRowAttachmentIndex].Attachment,
                    });

                    oModelAttach.refresh(true);
                }
                else {
                    // Add a new row if no valid index is set
                    aSeekAdvice.push({
                        Answer: null,
                        CrfSeekAdviceGuid: null,
                        DelMark: 0,
                        DepartmentCode: null,
                        DepartmentName: null,
                        NewAlert: "Y",
                        Parent_CrfReqGuid: null,
                        Question: null,
                        QuestionFromUserName: null,
                        QuestionFromUser_UserGuid: null,
                        QuestionToUserName: null,
                        QuestionToUser_UserGuid: null,
                        Role_RoleGuid: null,
                        RowNumber: aSeekAdvice.length + 1, // Dynamically increment row number
                        SendEmailQuestion: null,
                        SendEmailAnswer: null,
                        Attachment: oDialogData.Attachments
                    });

                    // Set the new row index for future updates
                    this.iRowAttachmentIndex = aSeekAdvice.length - 1;
                }

                // Update the main model with the modified data
                oMainModel.setProperty("/SeekAdvice", aSeekAdvice);

                // Close the dialog
                this._oDialogSeek.close();
            },

            onUpdateAttachmentSeekData: async function (res) {
                const attachmentSeekRes = this.getView().getModel("seekAttachResModel");
                const seekResData = attachmentSeekRes.getData();
                let attachmentData = [];
                let referenceGuid
                // Process each entry in `res`
                res.forEach((resItem) => {
                    referenceGuid = resItem.CrfSeekAdviceGuid || "";
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

            onCloseSeekAdviceDialog: function () {
                const oEventBus = sap.ui.getCore().getEventBus();
                oEventBus.unsubscribe("AttachmentChannel", "AttachmentUpdated", this.onAttachmentUpdate, this);

                if (this._oDialogSeek) {
                    this._oDialogSeek.close();
                }
            },

            onSelectCADLevel: async function (oEvent) {
                let sSelectedKey = oEvent.getSource().getSelectedKey();
                let oModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                let oResData = oModel.getData();
                let body = {
                    ProductCategoryGuid: oResData.ProductCatGuid_ProductCategoryGuid,
                    CADLevelCode: sSelectedKey,
                    CRFDATE: oResData.CrfReqDate
                }
                await this.createNewModelUsingAPI("POST", "/odata/v4/stoneman-crf/ProductGetCadLevel", body, "ProdGetModel");
                let enableModel = this.getView().getModel("ProdGetModel");
                let datamodel = enableModel.getData();
                oModel.setProperty('/CrfDelDate', datamodel.value[0].CADDeliveryDate);
            },

            fetchEnumData: async function (enumType, modelName, propertyPath) {
                try {
                    // Fetch the data using the generic API call
                    await this.createNewModelUsingAPI(
                        "GET",
                        `/odata/v4/stoneman-crf/MEnum?$filter=EnumType eq '${enumType}'`,
                        "",
                        modelName
                    );

                    // Extract the fetched data
                    const oResponseModel = this.getView().getModel(modelName);
                    let aData = oResponseModel.getData();
                    let enumData = aData.value;

                    // Set the data to the desired path in the target model
                    let oTargetModel = this.getView().getModel("ReqTypeModel");
                    oTargetModel.setProperty(propertyPath, enumData);
                } catch (error) {
                    console.error(`Failed to fetch data for ${enumType}:`, error);
                }
            },

            onSelectEnum: function (oEvent, propertyCode, propertyName) {
                let oSelectedItem = oEvent.getSource().getSelectedItem();
                let sSelectedKey = oEvent.getSource().getSelectedKey();
                let sSelectedText = oSelectedItem.getText();
                let oTargetModel = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oTargetModel.setProperty(propertyCode, sSelectedKey);
                oTargetModel.setProperty(propertyName, sSelectedText);
            },

            // Wrapper methods for Holder, Cord, and Shape
            getHolderData: function () {
                return this.fetchEnumData("LIGHTING_HOLDER", "lightHolderModel", "/LightHolder");
            },

            getCordData: function () {
                return this.fetchEnumData("LIGHTING_CORD", "lightCordModel", "/LightCord");
            },

            onSelectCord: function (oEvent) {
                this.onSelectEnum(oEvent, "/CordCode", "/CordName");
            },

            getShapeData: function () {
                return this.fetchEnumData("LIGHTING_SHAPE", "lightShapeModel", "/LightShape");
            },

            onSelectShape: function (oEvent) {
                this.onSelectEnum(oEvent, "/ShapeCode", "/ShapeName");
            },

            onSelectHolder: function (oEvent) {
                this.onSelectEnum(oEvent, "/HolderCode", "/HolderName");
            },

            getAttachemntRefrenceType: async function () {
                await this.createNewModelUsingAPI(
                    "GET",
                    `/odata/v4/stoneman-crf/MEnum?$filter=EnumType in ('CRFREQUEST_ATTACHMENT','CRFREQUEST_SEEKADVICE','CRFREQUEST_SINGLE_ATTACHMENT')`,
                    "",
                    "AttachmentRefModel"
                );
                // Extract the fetched data
                // const oResponseModel = this.getView().getModel("AttachmentRefModel");
                // let aData = oResponseModel.getData();
                // = aData.value;
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

            isTeamDeleteEnabled: function (sTeamUserGuid) {
                const oModel = this.getView().getModel("EntryFormDataSourceModel");
                const aApproval = oModel.getProperty("/ApprovalTransaction") || [];

                if (!sTeamUserGuid) return true;

                // Loop through ApprovalTransaction
                for (let i = 0; i < aApproval.length; i++) {
                    const oAT = aApproval[i];

                    // Loop DataFlow
                    const aDF = oAT.DataFlow || [];
                    for (let j = 0; j < aDF.length; j++) {
                        const oDF = aDF[j];

                        if (oDF.User_UserGuid === sTeamUserGuid &&
                            (oDF.RowStatus === "OPEN" || oDF.RowStatus === "CLOSED")) {

                            return false;
                        }
                    }
                }

                return true; // ✔️ enable 
            },
            onCrfApprovalGroupSelect: function (oEvent) {
                const iIndex = oEvent.getParameter("selectedIndex");
                const oModel = this.getView().getModel("EntryFormDataSourceModel");

                oModel.setProperty("/CrfApprovalReq", iIndex === 0 ? "Y" : "N");
                this.onRadioChange();
            },
            onCrfReCostingReqSelect: function (oEvent) {
                const iIndex = oEvent.getParameter("selectedIndex");
                const oModel = this.getView().getModel("EntryFormDataSourceModel");

                oModel.setProperty("/ReCostingReq", iIndex === 0 ? "Y" : "N");
                this.onRadioChange();
            },

            onDeleteMainAttachment: async function (oEvent) {
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
                // await this.deleteSingleAttachment(this.getEntryFormDataSourceModelName(), 'MainAttachment');
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

        });
    },



);
