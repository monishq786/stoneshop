sap.ui.define([

    "core/generic/genericlistview",
    "stoneman/modone/constants/Constant",
],
    function (genericlistview, Constant) {
        "use strict";
        let roleInfo;
        let loginInfo;
        return genericlistview.extend("modonecontroller.cadrequestlistview", {

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

                this.setPageId("cadreqlv");
                this.setFormTitle("CAD Search Form");
                this.setFormSubTitle("Search Result");

                let body = {
                    "guid": loginInfo.UserID,
                    "CRFREQNO": null,
                    "BUYERCODE": null,
                    "CRFSTATUS": null,
                    "Techno": null,
                    "CRFREQDATE": null
                }

                this.setListViewDataSourceProperties("POST", "/odata/v4/stoneman-crf/MyDocuments", body, "value");
                this.setListViewDisplayColumns(["cadReqNo", "reqType", "inputTypeSearch", "createdBy", "buyerName", "status", "edit"]);
                this.setListViewDataColumns(["CRFREQNO", "REQTYPE", "INPUTTYPE", "USERNAME", "BUYERNAME", "CRFSTATUS", "Edit"]);
                this.setListViewFilterColumn("cadreqlvInpCrfBuyer", "BuyerName", "Cfl", "eq", "String", "BUYERCODE", "cflForBuyer");
                this.setListViewFilterColumn("cadreqlvInpCrfReqNo", "CADRequestNo", "Cfl", "eq", "Int", "CRFREQNO", "cflForCrfReqNo");
                this.setListViewFilterColumn("cadreqlvInpCrfTech", "tech", "Cfl", "eq", "String", "Techno", "cflForTech");
                this.setListViewFilterColumn("cadreqlvSelCrfStatus", "status", "Select", "eq", "String", "CRFSTATUS", "cflForCrfStatus");
                this.setListViewFilterColumn("cadreqlvDate", "date", "DatePicker", "eq", "Date", "CRFREQDATE", "dataPickerForDate");
                this.setListViewEditProperty("CRFREQUUID");
                this.setForwardRoute("RouteCadRequestEntryForm");
                this.setBackwardRoute("RouteLanding");
                await this.showListView(this.getPageId());

                var sampleData = {
                    value: [
                        { key: "", text: "Select" },
                        { key: "New", text: "New" },
                        { key: "WIP", text: "In Progress" },
                        { key: "CLS", text: "Closed" }
                    ]
                };

                this.createNewModelUsingArray("statusModel", sampleData);
                //await this.createNewModelUsingAPI("GET", "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner", "", "modelBuyer");
                this.populateSelect("cadreqlvSelCrfStatus", "statusModel", "value", "key", "text");
                // this.populateSelect("cadreqlvSelCrfBuyer", "modelBuyer", "results", "BusinessPartner", "BusinessPartnerName");
                let oTable = this.getListViewTable();
                let headerToolbar = oTable.getHeaderToolbar();
                var aContent = headerToolbar.getContent(); // Get all controls inside the toolbar
                if (roleInfo.RoleCode === Constant.USER_ROLE_CODE.PD_COORDINATOR || roleInfo.RoleCode === Constant.USER_ROLE_CODE.PRODUCT_ENGG || roleInfo.RoleCode === Constant.USER_ROLE_CODE.TECHNOLOGIST || roleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_TL || roleInfo.RoleCode === Constant.USER_ROLE_CODE.QUALITY_ATL) {
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
                this.setCflDisplayColumns(["BusinessPartner", "Customer", "Supplier", "BusinessPartnerName"]);
                this.setCflDataColumns(["BusinessPartner", "Customer", "Supplier", "BusinessPartnerName"]);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfBuyer", "BusinessPartnerName", "BusinessPartner");
                this.setCflSearchProperty("BusinessPartnerName");
                this.showCfl("cadreqlvInpCrfBuyer", this.getCflListViewDataSourceModelName(), "d/results", this.onClosecflForBuyer.bind(this));
            },
            onClosecflForBuyer: function () {
                let oBuyerRes = this.getCflObject();
                let oBuyerSetData = this.getView().getModel(this.getEntryFormDataSourceModelName());
                oBuyerSetData.setProperty("/BuyerName", oBuyerRes.BusinessPartner);
            },



            cflForCrfReqNo: async function () {
                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/TCrfHeader?$orderby=CrfReqNo desc", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["Crf Req No"]);
                this.setCflDataColumns(["CrfReqNo"]);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfReqNo", "CrfReqNo");
                this.setCflSearchProperty("CrfReqNo");
                this.showCfl("cadreqlvInpCrfReqNo", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForCrfReqNo.bind(this));
            },

            onClosecflForCrfReqNo: function () {
                let x = this.getCflObject();
            },


            cflForTech: async function () {

                await this.createNewModelUsingAPI("GET", "/odata/v4/stoneman-crf/MUser?$expand=UserRoleCode&$filter=UserRoleCode_RoleCode_RoleConstant eq 'TECHNOLOGIST'", "", this.getCflListViewDataSourceModelName());
                this.setCflDisplayColumns(["DepartmentName", "UserRoleCode_RoleCode_RoleConstant", "Username"]);
                this.setCflDataColumns(["DepartmentName", "UserRoleCode_RoleCode_RoleConstant", "Username"]);
                this.setCflValueAndDisplay("", "", "cadreqlvInpCrfTech", "Username", "UserID");
                this.setCflSearchProperty("Username");
                this.showCfl("cadreqlvInpCrfTech", this.getCflListViewDataSourceModelName(), "value", this.onClosecflForTech.bind(this));

            },

            onClosecflForTech: function () {
                let x = this.getCflObject();
            },

            onClosecflForCrfTech: function () {
                let x = this.getCflObject();
            },

            cflForCrfStatus: function () {

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
