sap.ui.define([

    "core/generic/genericlistview",
    "stoneman/modone/constants/Constant",
],
    function (genericlistview, Constant) {
        "use strict";
        let roleInfo;
        let loginInfo;
        return genericlistview.extend("modonecontroller.crflistview", {

            onInit: function () {
                genericlistview.prototype.onInit.apply(this, arguments);
            },

            onBeforeShow: function (oEvent) {
                // this.validateAccess();
                roleInfo = this.getRoleDetails();
                loginInfo = this.getLoginInfo();
                this.initialize();
            },

            initialize: async function () {

                this.setPageId("crfLv");
                this.setFormTitle("CRF Search Form");
                this.setFormSubTitle("Search Result");

                let body = {
                    "BUYERNAME": null,
                    "CRFREQNO": null,
                    "CRFSTATUS": null,
                    "CRFREQDATE": null,
                    "REQTYPE": null,
                    "PDNO": null,
                    "PDNAME": null,
                    "REFCRFREQNO": 0,  //Trupti - crf grouping
                    "guid": loginInfo.UserID
                }

                console.log("body.........", body);

                this.setListViewDataSourceProperties("POST", "/odata/v4/stoneman-crf/GetCrfSearchData", body, "value");
                this.setListViewDisplayColumns(["crfNo", "Ref. CRF No", "reqType", "Product Category", "Item Desc", "buyerName", "status", "createdBy", "Action"]);
                this.setListViewDataColumns(["CRFREQNO", "REFCRFREQNO", "REQTYP", "PRODUCTCATNAME", "ITEMDESC", "BUYERNAME", "CRFSTATUS", "USERNAME", "Edit"]);

                this.setListViewFilterColumn("cadreqlvInpCrfBuyer", "Buyer Name", "Cfl", "eq", "String", "BUYERNAME", "cflForBuyer");
                this.setListViewFilterColumn("cadreqlvInpCrfReqNo", "CRF No.", "Cfl", "eq", "Int", "CRFREQNO", "cflForCrfReqNo");
                //this.setListViewFilterColumn("cadreqlvInpCrfTech", "tech", "Cfl", "eq", "String", "Techno", "cflForTech");
                this.setListViewFilterColumn("cadreqlvSelCrfStatus", "status", "Select", "eq", "String", "CRFSTATUS", "cflForCrfStatus");
                this.setListViewFilterColumn("cadreqlvSelCrfReqType", "reqType", "Select", "eq", "String", "REQTYPE", "cflForCrfReqType");
                this.setListViewFilterColumn("cadreqlvDate", "date", "DatePicker", "eq", "Date", "CRFREQDATE", "dataPickerForDate");
                //trupti - crf groouping
                this.setListViewFilterColumn("cadreqlvInpRefCrfReqNo", "RefCrfReqNo", "Cfl", "eq", "Int", "REFCRFREQNO", "cflForRefCrfReqNo");
                this.setListViewFilterColumn("crfpdnoID", "PD No", "Cfl", "eq", "String", "PDNO", "cflForPDNO");
                this.setListViewFilterColumn("crfpdnameID", "PD Name", "Cfl", "eq", "String", "PDNAME", "cflForPDName");

                this.setListViewEditProperty("CRFREQGUID");
                this.setForwardRoute("RouteCRFEntryForm");
                this.setBackwardRoute("RouteLanding");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");

                await this.showListView(this.getPageId());

                var sampleData = {
                    value: [
                        { key: "", text: "Select" },
                        { key: "New", text: "New" },
                        { key: "HOLD", text: "Hold" },
                        { key: "Work-in-Progress", text: "Work in Progress" },
                        { key: "Closed", text: "Closed" },
                        { key: "Cancel", text: "Cancel" }
                    ],
                    ReqType: [
                        { key: "", text: "Select" },
                        { key: "New", text: "New" },
                        { key: "Repeat", text: "Repeat" }
                    ]
                };

                this.createNewModelUsingArray("statusModel", sampleData);
                //await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner", "", "modelBuyer");
                this.populateSelect("cadreqlvSelCrfStatus", "statusModel", "value", "key", "text");
                this.populateSelect("cadreqlvSelCrfReqType", "statusModel", "ReqType", "key", "text");
                // this.populateSelect("cadreqlvSelCrfBuyer", "modelBuyer", "results", "BusinessPartner", "BusinessPartnerName");
                let oTable = this.getListViewTable();
                let headerToolbar = oTable.getHeaderToolbar();
                var aContent = headerToolbar.getContent(); // Get all controls inside the toolbar
                if (roleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR || roleInfo.RoleCode === Constant.USER_ROLE_CODE.DESIGNER || roleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG || roleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST || roleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL || roleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL) {
                    aContent.forEach(function (oControl) {
                        if (oControl.isA("sap.m.Button") && (oControl.getText() === 'Add New' || oControl.getText() === 'setting')) {
                            oControl.setVisible(false);
                        }
                    });
                }
            },

            cflForBuyer: async function () {
                //this.createNewModelUsingArray("pg1lvmyCflModel",sampleData);
                await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Business Partner", "Customer", "Supplier", "Business Partner Name"]);
                this.setCflDataColumns(["BusinessPartner", "Customer", "Supplier", "BusinessPartnerName"]);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfBuyer", "BusinessPartnerName", "BusinessPartner");
                this.setCflSearchProperty("BusinessPartnerName");
                this.setCflBaseUrlForPagination("/sap/opu/odata/sap/API_BUSINESS_PARTNER/");
                this.setCflListViewDataSourceProperties("GET", '/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner', "", "d/results");

                this.showCfl("cadreqlvInpCrfBuyer", this.getCflListViewDataSourceModelName(), "d/results", this.onClosecflForBuyer.bind(this));
            },
            onClosecflForBuyer: function () {
                let oBuyerRes = this.getCflObject();
                let oBuyerSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oBuyerSetData.setProperty("/BuyerName", oBuyerRes.BusinessPartner);
            },



            cflForCrfReqNo: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["CRF No", 'Buyer Name', 'Item Description', 'CRF Category']);
                this.setCflDataColumns(["CrfReqNo", 'BuyerName', 'ItemDesc', 'CrfCategory']);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfReqNo", "CrfReqNo");
                this.setCflSearchProperty("CrfReqNo");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc', "", "value");

                this.showCfl("cadreqlvInpCrfReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForCrfReqNo.bind(this));
            },

            //Trupti - CRF grouping
            cflForRefCrfReqNo: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Reference CRF No", 'Buyer Name', 'Item Description', 'CRF Category']);
                this.setCflDataColumns(["CrfReqNo", 'BuyerName', 'ItemDesc', 'CrfCategory']);
                this.setCflValueAndDisplay("", "", "cadreqlvInpRefCrfReqNo", "CrfReqNo");
                this.setCflSearchProperty("CrfReqNo");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc', "", "value");

                this.showCfl("cadreqlvInpRefCrfReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForRefCrfReqNo.bind(this));
            },

            onClosecflForRefCrfReqNo: function () {
                let x = this.getCflObject();
                let a = this.getListViewDataSourceURLReqData()
                if (x.RefCrfReqNo) {
                    a.REFCRFREQNO = x.RefCrfReqNo;
                } else {
                    a.REFCRFREQNO = 0;
                }
                this.setListViewDataSourceURLReqData(a)
            },


            cflForTech: async function () {

                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MUser?$expand=UserRoleCode&$filter=UserRoleCode_RoleCode_RoleConstant eq 'TECHNOLOGIST'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Department Name", "UserRoleCode_RoleCode_RoleConstant", "Username"]);
                this.setCflDataColumns(["DepartmentName", "UserRoleCode_RoleCode_RoleConstant", "Username"]);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfTech", "Username", "UserID");
                this.setCflSearchProperty("Username");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", "/odata/v4/stoneman-crf/MUser?$expand=UserRoleCode&$filter=UserRoleCode_RoleCode_RoleConstant eq 'TECHNOLOGIST'", "", "value");

                this.showCfl("cadreqlvInpCrfTech", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForTech.bind(this));

            },
            cflForPDNO: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["PD NO"]);
                this.setCflDataColumns(["PDNo"]);
                this.setCflValueAndDisplay("", "", "crfpdnoID", "PDNo");
                this.setCflSearchProperty("PDNo");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc', "", "value");

                this.showCfl("cadreqlvInpCrfReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForPDNO.bind(this));
            },

            onClosecflForPDNO: function () {
                let x = this.getCflObject();
            },
            cflForPDName: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["PD Name"]);
                this.setCflDataColumns(["PDName"]);
                this.setCflValueAndDisplay("", "", "crfpdnameID", "PDName");
                this.setCflSearchProperty("PDName");
                this.setCflBaseUrlForPagination("/odata/v4/stoneman-crf/");
                this.setCflListViewDataSourceProperties("GET", '/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc', "", "value");

                this.showCfl("cadreqlvInpCrfReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForPDName.bind(this));
            },

            onClosecflForPDName: function () {
                let x = this.getCflObject();
            },
            onClosecflForTech: function () {
                let x = this.getCflObject();
            },

            onClosecflForCrfTech: function () {
                let x = this.getCflObject();
            },

            cflForCrfStatus: function () {

            },
            onClosecflForCrfReqNo: function () {
                let x = this.getCflObject();
            },

            cflForCrfReqType: function () {

            },

            onClosecflForCrfStatus: function () {
                let x = this.getCflObject();
            },
            dataPickerForDate: function () {

            },
            selectForBuyer: function () {

            },


        })
    }
);
