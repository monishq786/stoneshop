sap.ui.define([
    "core/generic/genericlistview"
],
    function (genericlistview) {
        "use strict";
        let role;
        let loginInfo;
        return genericlistview.extend("moduleonecontroller.caddetaillistview", {

            onInit: function () {
                genericlistview.prototype.onInit.apply(this, arguments);
            },

            onBeforeShow: function (oEvent) {
                // this.validateAccess();
                this.initialize();
            },

            initialize: async function () {
                this.setPageId("caddetaillv");
                this.setFormTitle("CAD Detail Form");
                this.setFormSubTitle("Search Result");
                loginInfo = this.getLoginInfo();
                role = this.getRoleDetails();
                let body = {
                    loginUserId: loginInfo.UserID,
                    CADDETAILNO: null,
                    CadStatus: null,
                    BUYERCODE: null,
                    CrfDelDate: null,
                    MatGroupName: null,
                    ProductCategoryName: null,
                    CrfCategory: null,
                    CrfReqNo: null,
                    PendingWithMe: null

                    // Techno: null
                };
                this.setListViewDataSourceProperties("POST", "/odata/v4/stoneman-cad/getCadDetailData", body, "value");
                // this.setListViewDataSourceURL("/odata/v4/stoneman-crf/MyCADDetailDocuments");
                // this.setListViewDataSourceURLType("POST");
                // this.setListViewDataSourceURLReqData(body);
                // this.setListViewDataSourceURLType("GET");
                // this.setListViewDataSourceURL("/odata/v4/stoneman-crf/TCostingHeader"); 
                //await this.createNewModelUsingAPI("POST","/odata/v4/stoneman-crf/MyCADDetailDocuments",body,this.getListViewDataSourceModelName());
                // this.setListViewDisplayColumns(["caddetailno", "cadReqNo", "reqType", "inputTypeSearch", "createdBy", "buyerName","status","Edit"]);
                // this.setListViewDataColumns(["CadDetailNo", "CrfReqNo", "ReqTyp", "InputType", "createdBy", "BuyerName","CadStatus","Edit"]);
                this.setListViewDisplayColumns(["caddetailno", "cadReqNo", "reqType", "inputTypeSearch", "createdBy", "buyerName", "status", "Action"]);
                this.setListViewDataColumns(["CADDETAILNO", "CRFREQNO", "REQTYP", "INPUTTYPE", "USERNAME", "BUYERNAME", "CadStatus", "Edit"]);

                this.setListViewFilterColumn("caddetaillvInpBuyer", "Buyer Name", "Cfl", "eq", "String", "BUYERCODE", "cflForBuyer");
                //   this.setListViewFilterColumn("caddetaillvInpMerchant", "Merchant Name", "Cfl", "eq", "String", "MerchantName", "cflForMerchant");

                //  this.setListViewFilterColumn("caddetaillvInpPDNo", "PD No", "Cfl", "eq", "String", "PDNo", "cflForPDNO");
                this.setListViewFilterColumn("caddetaillvMaterial", "Material Category", "Cfl", "eq", "String", "MatGroupName", "cflForMaterial");

                this.setListViewFilterColumn("caddetaillvInpCadDetailNo", "CAD No.", "Cfl", "eq", "String", "CADDETAILNO", "cflForCADDetailNo");
                this.setListViewFilterColumn("caddetaillvDate", "CAD Delivery Date", "DatePicker", "eq", "Date", "CrfDelDate", "dataPickerForDate");
                this.setListViewFilterColumn("caddetaillvSelCrfStatus", "Status", "Select", "eq", "String", "CadStatus", "selectForStatus");
                this.setListViewFilterColumn("caddetaillvProductCat", "Product Category Code", "Cfl", "eq", "String", "ProductCategoryName", "cflForProductCat");
                this.setListViewFilterColumn("caddetaillvCrfCate", "CRF Category", "Select", "eq", "String", "CrfCategory", "selectForStatus");
                this.setListViewFilterColumn("caddetaillvCrfNo", "CRF No.", "Cfl", "eq", "String", "CrfReqNo", "cflForCrfNo");
                this.setListViewFilterColumn("caddetaillvFormWithme", "Pending With Me", "CheckBox", "eq", "Boolean", "PendingWithMe", "onCheckboxForPending");

                //this.setListViewFilterColumn("coplvSelect", "Status", "Select", "eq", "String", "CadStatus","selectForStatus");
                this.setListViewEditProperty("CadDetailUUID");

                var sampleData = {

                    value: [

                        { key: "", text: "Select" },

                        { key: "AutoDraft", text: "AutoDraft" }, //trupti new added                      

                        { key: "WIP", text: "In Progress" },

                        { key: "CLS", text: "Closed" },

                        { key: "C", text: "Cancelled" },

                    ]

                };

                this.createNewModelUsingArray("statusModel", sampleData);

                var sampleCategoryData = {
                    value: [
                        { key: "", text: "Select" },
                        { key: "CAD", text: "CAD" },
                        { key: "Rendering", text: "Rendering" },
                        { key: "HandWritten", text: "HandWritten" }

                    ]
                };
                this.createNewModelUsingArray("crfCategoryModel", sampleCategoryData);

                this.setForwardRoute("RouterNameCADDetailEntryForm_new");
                this.setBackwardRoute("RouteLanding");
                await this.showListView("caddetaillv");
                this.populateSelect("caddetaillvSelCrfStatus", "statusModel", "value", "key", "text");
                this.populateSelect("caddetaillvCrfCate", "crfCategoryModel", "value", "key", "text");
                let oTable = this.getListViewTable();
                const headerToolbar = oTable.getHeaderToolbar();
                const aContent = headerToolbar.getContent();
                if (role['RoleCode'] === 'DTP_HEAD') {
                    aContent.forEach(function (oControl) {
                        if (oControl.isA('sap.m.Button') && oControl.getText() === 'Add New') {
                            oControl.setVisible(false); // Hide the button
                        }
                    });
                }
            },

            cflForMerchant: async function () {

            },

            cflForPDNO: async function () {

            },

            cflForBuyer: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                this.setCflTitle("Buyer List");
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Business Partner", "Customer", "Supplier", "Business Partner Name"]);
                this.setCflDataColumns(["BusinessPartner", "Customer", "Supplier", "BusinessPartnerName"]);
                this.setCflValueAndDisplay("", "", "caddetaillvInpBuyer", "BusinessPartnerName", "BusinessPartner");
                this.setCflSearchProperty("BusinessPartnerName");
                this.showCfl("caddetaillvInpBuyer", this.getCflListViewDataSourceModelName(), "d/results", this.onClosecflForBuyer.bind(this));
            },

            cflForProductCat: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                this.setCflTitle("Product Category List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MProductCategory?$filter=DelMark eq 0 and IsActive eq 'Y'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(['Product Category Code', 'Product Category Name']);
                this.setCflDataColumns(['ProductCategoryCode', 'ProductCategoryName']);
                this.setCflValueAndDisplay("", "", "caddetaillvProductCat", "ProductCategoryName");
                this.setCflSearchProperty("ProductCategoryName");
                this.showCfl("caddetaillvProductCat", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForTech.bind(this));
            },

            cflForCrfCate: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                this.setCflTitle("Crf Category List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(['Crf Category Code']);
                this.setCflDataColumns(['CrfCategory']);
                this.setCflValueAndDisplay("", "", "caddetaillvCrfCate", "CrfCategory");
                this.setCflSearchProperty("CrfCategory");
                this.showCfl("caddetaillvCrfCate", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForTech.bind(this));
            },

            cflForCrfNo: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                this.setCflTitle("Crf Category List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(['CRF No', , 'Buyer Name', 'Item Description', 'CRF Category']);
                this.setCflDataColumns(['CrfReqNo', 'BuyerName', 'ItemDesc', 'CrfCategory']);
                this.setCflValueAndDisplay("", "", "caddetaillvCrfNo", "CrfReqNo");
                this.setCflSearchProperty("CrfReqNo");
                this.showCfl("caddetaillvCrfNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForTech.bind(this));
            },

            cflForMaterial: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                this.setCflTitle("Material Category List");
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/ZUI_MAT_GRP_DT_API/ZC_MAT_GRP_DT?$filter=MatGroup ne '-1'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(['Material Category Code', 'Material Category Name']);
                this.setCflDataColumns(['MatGroup', 'MatGroupName']);
                this.setCflValueAndDisplay("", "", "caddetaillvMaterial", "MatGroupName");
                this.setCflSearchProperty("MatGroupName");
                this.showCfl("caddetaillvMaterial", this.getCflListViewDataSourceModelName(), "d/results", this.onClosecflForTech.bind(this));
            },

            onClosecflForBuyer: function () {
                let x = this.getCflObject();
                let y = this.getView().getModel(this.getListViewDataSourceModelName());
                y.setProperty("/BuyerCode", x.BusinessPartner);


            },
            onClosecflForCADDetailNo: function () {
                let x = this.getCflObject();
            },
            onClosecflForTech: function () {
                let x = this.getCflObject();
            },
            cflForCADDetailNo: async function () {
                this.setCflTitle("CAD Detail No List");
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-cad/TCadDetail?$orderby=CadDetailNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["CAD No"]);
                this.setCflDataColumns(["CadDetailNo"]);
                this.setCflValueAndDisplay("", "", "caddetaillvInpCadDetailNo", "CadDetailNo");
                this.setCflSearchProperty("CadDetailNo");
                this.showCfl("caddetaillvInpCadDetailNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForCADDetailNo.bind(this));
            },
            dataPickerForDate: function () {

            },
            onCheckboxForPending: function () {

            },
            selectForStatus: function () {

            }
        })
    }
);