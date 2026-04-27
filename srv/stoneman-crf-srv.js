const cds = require('@sap/cds');
const commonfun = require('./stoneman-common-srv');
const { constants } = require('@sap/xssec');
const SequenceHelper = require("./lib/SequenceGenerator");
const FormFlowRuleBook = require('./lib/FormFlowRuleBook');
const approvalfun = require('./stoneman-approval-srv');
const { context } = require('@sap/cds');
const { sendMail } = require('@sap-cloud-sdk/mail-client');
const verifyToken = require('./verifykey')
var reqStageGuid;  //notify
let flow = null;

module.exports = cds.service.impl(async (service) => {
    const db = await cds.connect.to("db");
    const { MMenu, MRole, MStage, TCrfHeader, MBuyerProductCat, MProductSubCat, MNotifyTemplate, MEmailTemplate, MMenuRoleAccess, MProductCategory, MUser, MProcess } = service.entities;
    const { ErrorLog } = db.entities('Stonemen');

    // service.before('*', verifyToken); for authentication of API
    //commented by Trupti -- causing issue . define in within event , wherever required.
    // const { TForgotPassword } = service.entities;

    service.before("CREATE", 'TCrfHeader__a', async (context) => {
        const { TCrfHeader } = service.entities;
        //#region Auto generate no. for CRFHeader
        const productId = new SequenceHelper({
            db: db,
            sequence: "SEQ_CRF_ID",
            table: "TCrfHeader",
            field: "CrfReqNo"
        });
        context.data.CrfReqNo = await productId.getNextNumber();

        console.log("context.data.CrfReqNo", context.data.CrfReqNo);
        if (flow) {
            context.reject(422, "Check Flow Details")
        } else {
            applyFormFlowRules(context);
            flow = commonfun.decodeFlowCode(context.data.FlowCode);
        }
        // console.table(flow)
        // console.log(flow)
        if (flow.CRF === true && flow.CRF_AutoApprove === true) {
            context.data.CrfStatus = "CLS"
            context.data.newApprovalStatus = "APPROVED"
            flow.CRF_Done = true
            return;
        }
        //#endregion

        //#region Get Data from MProductCatagory
        const ProductCatagoryData = await SELECT.one.from(MProductCategory).where({ ProductCategoryGuid: context.data.ProductCatGuid_ProductCategoryGuid });

        if (!ProductCatagoryData) {
            throw context.error("Error: On auto generate Unique Category no.");
        }
        const result = await db.run(SELECT.from(TCrfHeader).columns([{ func: 'count', args: ['*'], as: 'count' }]).where({ ProductCatCode: ProductCatagoryData.ProductCategoryCode }));
        context.data.CategoryUniqueNum = await commonfun.generateCategoryUniqueNum(ProductCatagoryData, result);

        //Rishiraj - CRF group
        const reqType = context.data.ReqTyp;
        if (reqType == "R") {
            // console.log('1-bfore', service.entities);

            let result = await commonfun.getDataFromTable({
                tableName: 'DCrfHeader',
                conditions: [
                    ['CrfReqGuid', '=', context.data.OldCrfReqNoGuid_CrfReqGuid]
                ],
                columns: ["RefCrfReqNo"]
            });

            // If Ref fields are NULL → assign current CRF values
            if (result[0].RefCrfReqNo) {
                // console.log('inside - before');
                // context.data.RefCrfReqNoGuid = result[0].RefCrfReqNoGuid;
                context.data.RefCrfReqNo = result[0].RefCrfReqNo;
            }
        }
        else {
            context.data.RefCrfReqNo = context.data.CrfReqNo
        }
        //

        //#endregion
    });
    service.before(['CREATE', 'UPDATE'], 'TCrfHeader', async (req) => {
        // flow = commonfun.decodeFlowCode(context.data.FlowCode);
        // if(!flow){
        //     await applyFormFlowRules(req);
        //     flow = commonfun.decodeFlowCode(req.data.FlowCode);
        // }
        // console.table(flow)
        // console.log(flow)
        if (req.event == "CREATE") {
            const { TCrfHeader } = service.entities;
            //#region Auto generate no. for CRFHeader
            const productId = new SequenceHelper({
                db: db,
                sequence: "SEQ_CRF_ID",
                table: "TCrfHeader",
                field: "CrfReqNo"
            });
            req.data.CrfReqNo = await productId.getNextNumber();

            console.log("req.data.CrfReqNo", req.data.CrfReqNo);
            applyFormFlowRules(req);

            if (flow) {
                // req.reject(422,"Check Flow Details")
                flow = null
                flow = commonfun.decodeFlowCode(req.data.FlowCode);
            } else {
                flow = commonfun.decodeFlowCode(req.data.FlowCode);
            }
            // console.table(flow)
            // console.log(flow)
            if (flow.CRF === true && flow.CRF_AutoApprove === true) {
                req.data.CrfStatus = "CLS"
                req.data.newApprovalStatus = "APPROVED"
                flow.CRF_Done = true
                // return;
            }
            //#endregion

            //#region Get Data from MProductCatagory
            const ProductCatagoryData = await SELECT.one.from(MProductCategory).where({ ProductCategoryGuid: req.data.ProductCatGuid_ProductCategoryGuid });

            if (!ProductCatagoryData) {
                throw req.error("Error: On auto generate Unique Category no.");
            }
            const result = await db.run(SELECT.from(TCrfHeader).columns([{ func: 'count', args: ['*'], as: 'count' }]).where({ ProductCatCode: ProductCatagoryData.ProductCategoryCode }));
            req.data.CategoryUniqueNum = await commonfun.generateCategoryUniqueNum(ProductCatagoryData, result);

            //Rishiraj - CRF group
            const reqType = req.data.ReqTyp;
            if (reqType == "R") {
                // console.log('1-bfore', service.entities);

                let result = await commonfun.getDataFromTable({
                    tableName: 'DCrfHeader',
                    conditions: [
                        ['CrfReqGuid', '=', req.data.OldCrfReqNoGuid_CrfReqGuid]
                    ],
                    columns: ["RefCrfReqNo"]
                });

                // If Ref fields are NULL → assign current CRF values
                if (result[0].RefCrfReqNo) {
                    // console.log('inside - before');
                    // req.data.RefCrfReqNoGuid = result[0].RefCrfReqNoGuid;
                    req.data.RefCrfReqNo = result[0].RefCrfReqNo;
                }
            }
            else {
                req.data.RefCrfReqNo = req.data.CrfReqNo
            }
            //
        }


        if (req.data.SaveOrSubmit != "SeekAdvice") {

            const curLoginUserGuid = req.data.loginUserID_UserGuid;
            let curStageGuid = req.data.Stage_StageGuid;
            const curTemplateGuid = req.data.Template_TemplateGuid;
            let curStageIsFirstStage = "N";
            let curStageIsApproval = "N";
            let curStageNoofApprovalsReq = 0;
            let curStageNoofRejectionsReq = 0;
            let curStageCode = "";
            let curDataRowNumber = 0;
            reqStageGuid = req.data.Stage_StageGuid;


            // set
            const startTimeValue = '09:00:00';
            const endTimeValue = '21:00:00'; // 9 PM in 24-hour format
            req.data.StartTime = startTimeValue;
            req.data.EndTime = endTimeValue;
            req.data.TimeSlotMinutes = 30;

            try {
                //#region HOLD
                if (req.event == "UPDATE") {
                    if (req.data.SaveOrSubmit == 'HOLD') {
                        req.data.CrfStatus = await commonfun.HOLDCRF(req);
                    }
                    if (req.data.SeekAdvice == null)
                        req.data.SeekAdvice = [];
                    if (req.data.SeekAdvice.length > 0 && req.data.Template_TemplateGuid == null || undefined) {
                        return
                    }
                }
                //#endregion

                if (curTemplateGuid == undefined)
                    throw req.reject('\nCrf form Approval Template is not defined!!!');

                //#region set crf menu
                if (req.data.MMenu_MenuGuid == undefined || req.data.MMenu_MenuGuid == "") {
                    let curMenuDetails = await commonfun.getDataFromTable({
                        tableName: 'MMenu',
                        conditions: [
                            ['MenuCode', '=', 'CRF'],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["MenuGuid"]
                    });

                    if (curMenuDetails.length > 0) {
                        req.data.MMenu_MenuGuid = curMenuDetails[0].MenuGuid;
                    }
                    else
                        throw req.reject('\nCrf form Menu with Code (CRF) is not defined!!!');
                }
                //#endregion

                //#region set crf stage 
                if (curStageGuid == undefined || curStageGuid == "") {
                    //set the first stage
                    let firtStageGuid = await commonfun.getDataFromTable({
                        tableName: 'CTemplateStage',
                        conditions: [
                            ['Parent_TemplateGuid', '=', req.data.Template_TemplateGuid],
                            ['DelMark', '=', '0'],
                            ['StageSeqId', '=', '1']
                        ],
                        columns: ["Stage_StageGuid"]
                    });

                    if (firtStageGuid.length > 0) {
                        curStageIsFirstStage = "Y";
                        curStageGuid = firtStageGuid[0].Stage_StageGuid;
                        req.data.Stage_StageGuid = curStageGuid;
                    };

                    let curStageDetails = await commonfun.getDataFromTable({
                        tableName: 'MStage',
                        conditions: [
                            ['StageGuid', '=', req.data.Stage_StageGuid]
                        ],
                        columns: ["StageCode"]
                    });

                    if (curStageDetails.length > 0) {
                        curStageCode = curStageDetails[0].StageCode;
                        req.data.CrfStageCode = curStageCode;
                    }
                    else {
                        throw req.reject("Stage " + req.data.Stage_StageGuid + " is not defined!!!");
                    }
                }
                //#endregion 

                //#region set current Stage Details
                if (curStageGuid != undefined) {
                    //check if approval or workflow
                    let curStageDetails = await commonfun.getDataFromTable({
                        tableName: 'MStage',
                        conditions: [
                            ['StageGuid', '=', req.data.Stage_StageGuid]
                        ],
                        columns: ["IsApproval", "NoOfApprovals", "NoOfRejections", "StageCode"]
                    });

                    if (curStageDetails.length > 0) {
                        curStageIsApproval = curStageDetails[0].IsApproval;
                        curStageNoofApprovalsReq = curStageDetails[0].NoOfApprovals;
                        curStageNoofRejectionsReq = curStageDetails[0].NoOfRejections;
                        curStageCode = curStageDetails[0].StageCode;
                        req.data.CrfStageCode = curStageCode;
                    }

                    if (req.data.ApprovalTransaction.length == 1) {
                        curStageIsFirstStage = 'Y';
                    }
                }
                else {
                    throw req.reject("Current Stage Guid  is not defined!!!");
                }

                //#endregion

                //#region Create Crf
                if (req.event == "CREATE" && curStageIsFirstStage == "Y") {

                    //#region crf save with firststage [Add mode]
                    if (req.data.SaveOrSubmit == "SAVE") {

                        //create - save - undefined/first stage   //set stage & insert 1 record
                        // let requestData = req.data;
                        // function updateStage(StageData, requestData) {
                        //     return StageData.filter(roleData => roleData.Stage_StageGuid == requestData.Stage_StageGuid);
                        // }
                        //req.data = await approvalfun.createFirstStageApprovalTransactionPayload(req.data, curStageIsFirstStage);
                        req.data = await approvalfun.createFirstStageApprovalTransactionPayload(req, curStageIsFirstStage);
                        req.data.CrfStatus = "WIP";
                        req.data.CrfReqDate = new Date().toISOString().split("T")[0]; // update the Today Date - Rishiraj
                    }
                    //#endregion

                    //#region crf submit with firststage [Add mode]
                    else if (req.data.SaveOrSubmit == "SUBMIT") {

                        req.data.CrfReqDate = new Date().toISOString().split("T")[0];// update the Today Date - Rishiraj
                        //check ddata length

                        //

                        //#region result = Validation
                        //let isDocUploaded = await commonfun.isDocumentUploaded(req.data, curStageIsFirstStage);
                        let isDocUploaded = await commonfun.isDocumentUploaded(req, curStageIsFirstStage);
                        // let isDocUploaded = true

                        //#endregion

                        if (curStageIsFirstStage == 'N' && (isDocUploaded == null || isDocUploaded == undefined)) {
                            throw new Error("Issue in isDocumentUploaded(). Please check!!!");
                        }
                        req.data.CrfStatus = "WIP";

                        //if result = true
                        //create - submit - undefined/first stage //set stage & insert all records
                        //open next stage
                        //set crf stage to next stage
                        //if result = false
                        //set stage & insert 1 record

                        //#region if result = true
                        if (isDocUploaded) {
                            //#region insert all stages

                            //#region get all stages
                            const AllStageofthisform2 = await commonfun.getDataFromTable({
                                tableName: 'CTemplateStage',
                                conditions: [
                                    ['Parent_TemplateGuid', '=', req.data.Template_TemplateGuid],
                                ],
                                columns: ["Stage_StageGuid", "Stage.IsApproval as IsApproval"]
                            });
                            //#endregion

                            //#region get all roles
                            let AllRoleForAllStage = [];
                            for (let i = 0; i < AllStageofthisform2.length; i++) {

                                //get next stage for this template
                                //trupti
                                tempStage = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, AllStageofthisform2[i].Stage_StageGuid);
                                let roleOfThisStageGuid = null;

                                //final stage 
                                if (tempStage.length == 0) {
                                    //get role of user who created crf 
                                    createdByUserRoleGuid = await commonfun.getDataFromTable({
                                        tableName: 'MUser',
                                        conditions: [
                                            ['UserGuid', '=', req.data.CreatedByUserID_UserGuid],
                                            ['DelMark', '=', '0']
                                        ],
                                        columns: ["Role_RoleGuid"]
                                    });

                                    //this is the last stage
                                    if (AllStageofthisform2[i].IsApproval == "Y") {
                                        roleOfThisStageGuid = await commonfun.getDataFromTable({
                                            tableName: 'CStageRole',
                                            conditions: [
                                                ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                                ['Role_RoleGuid', '=', createdByUserRoleGuid[0].Role_RoleGuid],
                                                ['DelMark', '=', '0']
                                            ],
                                            columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                        });
                                    } else {
                                        roleOfThisStageGuid = await commonfun.getDataFromTable({
                                            tableName: 'CStageRole',
                                            conditions: [
                                                ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                                ['DelMark', '=', '0']
                                            ],
                                            columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                        });
                                    }
                                }
                                else {
                                    roleOfThisStageGuid = await commonfun.getDataFromTable({
                                        tableName: 'CStageRole',
                                        conditions: [
                                            ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                            ['DelMark', '=', '0']
                                        ],
                                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                    });
                                }
                                //

                                // let roleOfThisStageGuid = await commonfun.getDataFromTable({
                                //     tableName: 'CStageRole',
                                //     conditions: [
                                //         ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                //         ['DelMark', '=', '0']
                                //     ],
                                //     columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                // });

                                if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                                    AllRoleForAllStage = AllRoleForAllStage.concat(roleOfThisStageGuid); // Flatten the array
                                }
                            }
                            //#endregion
                            // Start - Validate user - Rishiraj
                            await commonfun.validateUsersInTeamForEachStage(req, 1); // validate user Team user -Rishiraj
                            // 1 insure validation work for next level only if 2 then validation work for next and next of next 
                            await approvalfun.createUserAssignAndAddToPayload(req) // add user assign data - Rishiraj
                            // End - Validate user - Rishiraj

                            //#region Generate the payload - All stages , all users
                            //let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, AllRoleForAllStage, req.data, null);
                            let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, AllRoleForAllStage, req, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                //throw new Error("Issue in createApprovalTransactionPayload(). Please check!!!");
                                throw req.reject("Issue in createApprovalTransactionPayload(). Please check!!!");
                            }
                            else {
                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }
                            //#endregion

                            //#endreion

                            //#region close current stage & flow
                            curDataRowNumber = 1
                            //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                throw req.reject("Please check updateStageAndFlow()!!!");
                            }
                            else {

                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }
                            //#endregion

                            //#region set crf stage to next stage
                            let nextStageisApproval;
                            //nextStageData = await commonfun.getNextStageGuid(req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            if (nextStageData.length > 0) {
                                req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                req.data.CrfStageCode = nextStageData[0].StageCode;

                                //now
                                nextStageisApproval = nextStageData[0].IsApproval;

                                //#region open next stage
                                curDataRowNumber = 2
                                //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'OPEN', null, null);
                                generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', null, null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw req.reject("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion

                                if (curStageIsApproval == "N" && nextStageisApproval == "Y") {
                                    //set the ccrfattachment row with (stageguid = currentStage & approval status = 'NA') row to approval status = "Pending" 
                                }
                            }
                            //#endregion
                        }
                        //#endregion

                        //#region if result = false
                        else {
                            // let requestData = req.data;
                            // function updateStage(StageData, requestData) {
                            //     return StageData.filter(roleData => roleData.Stage_StageGuid == requestData.Stage_StageGuid);
                            // }
                            //req.data = await approvalfun.createFirstStageApprovalTransactionPayload(req.data);
                            req.data = await approvalfun.createFirstStageApprovalTransactionPayload(req);
                        }
                        //#endregion

                    }
                    //#endregion

                }
                //#endregion

                //#region Update Crf when it is on first stage & remainig stages
                else if (req.event == "UPDATE" && curStageIsFirstStage == "Y") {

                    //#region crf Save with firststage [Update mode]
                    if (req.data.SaveOrSubmit == "SAVE") {
                        req.data.CrfReqDate = new Date().toISOString().split("T")[0]; // update the Today Date - Rishiraj
                        //length = 1
                        //update - save - firststage    //do nothing
                        if (req.data.ApprovalTransaction.length = 1) {
                            return;
                        }
                    }
                    //#endregion

                    //#region crf Submit with firststage [Update mode]
                    else if (req.data.SaveOrSubmit == "SUBMIT") {
                        req.data.CrfReqDate = new Date().toISOString().split("T")[0]; // update the Today Date - Rishiraj
                        //validate loginuser belongs to  curstagerole
                        //const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req.data);
                        const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req);

                        //if no - do nothing
                        if (isLoginUserValid == false) {
                            throw req.reject("Login user is not valid. Please check isLoginUserValidForCurrentStage()!!!");
                        };

                        //result = Validation

                        //const isDocUploaded = await commonfun.isDocumentUploaded(req.data, curStageIsFirstStage);
                        const isDocUploaded = await commonfun.isDocumentUploaded(req, curStageIsFirstStage);
                        // const isDocUploaded = true

                        //if result = true
                        if (isDocUploaded) {
                            //#region insert all stages

                            //#region get all stages
                            const AllStageofthisform2 = await commonfun.getDataFromTable({
                                tableName: 'CTemplateStage',
                                conditions: [
                                    ['Parent_TemplateGuid', '=', req.data.Template_TemplateGuid],
                                ],
                                columns: ["Stage_StageGuid"]
                            });
                            //#endregion

                            //#region get all roles
                            let AllRoleForAllStage = [];
                            for (let i = 0; i < AllStageofthisform2.length; i++) {

                                //trupti
                                //get next stage for this template
                                //trupti
                                tempStage = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, AllStageofthisform2[i].Stage_StageGuid);
                                let roleOfThisStageGuid = null;

                                //final stage 
                                if (tempStage.length == 0) {
                                    //get role of user who created crf 
                                    createdByUserRoleGuid = await commonfun.getDataFromTable({
                                        tableName: 'MUser',
                                        conditions: [
                                            ['UserGuid', '=', req.data.CreatedByUserID_UserGuid],
                                            ['DelMark', '=', '0']
                                        ],
                                        columns: ["Role_RoleGuid"]
                                    });

                                    //this is the last stage
                                    roleOfThisStageGuid = await commonfun.getDataFromTable({
                                        tableName: 'CStageRole',
                                        conditions: [
                                            ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                            ['Role_RoleGuid', '=', createdByUserRoleGuid[0].Role_RoleGuid],
                                            ['DelMark', '=', '0']
                                        ],
                                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                    });
                                }
                                else {
                                    //....

                                    roleOfThisStageGuid = await commonfun.getDataFromTable({
                                        tableName: 'CStageRole',
                                        conditions: [
                                            ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                            ['DelMark', '=', '0']
                                        ],
                                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                                    });
                                }

                                if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                                    AllRoleForAllStage = AllRoleForAllStage.concat(roleOfThisStageGuid); // Flatten the array
                                }
                            }

                            //#endregion
                            // Start - Validate user - Rishiraj
                            await commonfun.validateUsersInTeamForEachStage(req, 1); // validate user Team user -Rishiraj
                            //await approvalfun.createUserAssignAndAddToPayload(req.data) // add user assign data - Rishiraj
                            await approvalfun.createUserAssignAndAddToPayload(req) // add user assign data - Rishiraj
                            // End - Validate user - Rishiraj

                            //#region Generate the payload - All stages , all users
                            //let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, AllRoleForAllStage, req.data, null);
                            let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, AllRoleForAllStage, req, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                throw req.reject("Issue in createApprovalTransactionPayload(). Please check!!!");
                            }
                            else {
                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }
                            //#endregion

                            //#endreion

                            //#region close current stage & flow
                            curDataRowNumber = 1
                            //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                throw req.reject("Please check updateStageAndFlow()!!!");
                            }
                            else {

                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }
                            //arrEmail( req.data.Stage_StageGuid, req.data.CrfStageCode,'TEAMS', TemplateCode,ListofPlaceHolderKeyvalue,ListOfTo,ListofCC,Subject);

                            //#endregion

                            //#region set crf stage to next stage
                            //nextStageData = await commonfun.getNextStageGuid(req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            if (nextStageData.length > 0) {
                                req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                req.data.CrfStageCode = nextStageData[0].StageCode;

                                //#region open next stage
                                curDataRowNumber = 2;
                                //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'OPEN', null, null);
                                generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', null, null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw req.reject("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion

                                //arrEmail( req.data.Stage_StageGuid, req.data.CrfStageCode,'PDC-MEETING', TemplateCode,ListofPlaceHolderKeyvalue,ListOfTo,ListofCC,Subject);

                            }
                            //#endregion



                        }

                        //if result = false
                        else {
                            //do nothing
                            //throw req.info(404, "Document not yet uploaded for this stage()!!!");
                            throw req.error("Document not yet uploaded for this stage()!!!");  //CHECK with RITURAJ 
                        }
                    }
                    //#endregion
                }
                //#endregion

                //#region Update Crf
                else if (req.event == "UPDATE" && req.data.SaveOrSubmit == "SUBMIT") {
                    //validate loginuser belongs to  curstagerole
                    //const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req.data);
                    const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req);

                    //if no - do nothing
                    if (isLoginUserValid == false) {
                        throw req.reject("Login user is not valid. Please check isLoginUserValidForCurrentStage()!!!");
                    };
                    // Team Validation Start - Rishiraj
                    await commonfun.validateUsersInTeamForEachStage(req);
                    try {
                        await commonfun.processMissingUsers(req)
                    } catch (error) {
                        console.error('Error during processMissingUsers():', error);
                        throw req.reject(400, "Error in processMissingUsers(): Unable to add user in data flow" + error)
                    }
                    // Team Validation End - Rishiraj

                    //if yes
                    //get type of current stage (w or A)
                    //if (stagetype = W)
                    if (curStageIsApproval == "N") {

                        //b= validate the current stage, if it is workflow
                        //const isDocUploaded = await commonfun.isDocumentUploaded(req.data, curStageIsFirstStage);
                        const isDocUploaded = await commonfun.isDocumentUploaded(req, curStageIsFirstStage);
                        // const isDocUploaded = true

                        //(b = all users of current stage have uploaded documents)
                        //if b = true
                        if (isDocUploaded) {

                            curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);

                            //#region close current stage & flow
                            //generatedPayload = await approvalfun.updateStageAndFlow(-1, req.data, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'CLOSE', null, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                throw req.reject("Please check updateStageAndFlow()!!!");
                            }
                            else {

                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }
                            //#endregion

                            //#region set crf stage to next stage
                            //const nextStageData = await commonfun.getNextStageGuid(req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            const nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            if (nextStageData.length > 0) {
                                req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                req.data.CrfStageCode = nextStageData[0].StageCode;

                                //#region open next stage
                                //provide the next rownumber for newly set active stage
                                curDataRowNumber = curDataRowNumber + 1;
                                //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'OPEN', null, null);
                                generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', null, null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw new Error("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion


                                //arrEmail( req.data.Stage_StageGuid, req.data.CrfStageCode,'PRODUCT ENGINEER', TemplateCode,ListofPlaceHolderKeyvalue,ListOfTo,ListofCC,Subject);
                                //arrEmail( req.data.Stage_StageGuid, req.data.CrfStageCode,'TECHNOLIST', TemplateCode,ListofPlaceHolderKeyvalue,ListOfTo,ListofCC,Subject);

                            }
                            else {   //not futher stages. close the form
                                req.data.CrfStatus = "CLS";
                                //req.data.Stage_StageGuid =null;
                                req.data.ApprovalStatus = "NA";
                                flow.CRF_Done = true;
                            }
                            //#endregion
                        }
                        //else if b = false
                        else {
                            //do nothing
                            req.reject(400, "Attachment is required for this user")
                        }
                    }
                    else if (curStageIsApproval == "Y") {
                        //else if (stagetype=A)
                        if (!(req.data.newApprovalStatus == 'APPROVED' || req.data.newApprovalStatus == 'REJECTED')) {
                            return;
                        }

                        const isDocUploaded = await commonfun.isDocumentUploaded(req, curStageIsFirstStage);
                        // const isDocUploaded = true
                        if (!isDocUploaded) {
                            req.reject(400, "Please Upload the Attachment")
                        }

                        if (req.data.newApprovalStatus == 'REJECTED') {

                            //if (rejected)
                            //update & close stage
                            //update flow & close flow

                            //get current open stage rownumber in data //4
                            curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);

                            //#region NoofRejectionsReq >0
                            if (curStageNoofRejectionsReq != -1) {

                                //insert new records for current stage & prev stage in data & flow
                                //#region   curDataRowNumber=4
                                //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, 'REJECTED', 'INSERTNEW');
                                generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, 'REJECTED', 'INSERTNEW');
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw new Error("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion

                                //arrEmail( req.data.Stage_StageGuid, req.data.CrfStageCode,'TECHNO-REJECTION', TemplateCode,ListofPlaceHolderKeyvalue,ListOfTo,ListofCC,Subject);

                                //set crf stage to previous stage
                                //#region set crf stage to previous stage
                                //const nextStageData = await commonfun.getNextStageGuid(req.data.Template_TemplateGuid, req.data.Stage_StageGuid, -1);
                                const nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid, -1);
                                if (nextStageData.length > 0) {
                                    //designupload(close) -rownumber = 3, techno(close)- rownumber=4, techno(NA)--INSERTED & ronumber=6,design(0pen)--INSERTED & rownumber=5

                                    //curDataRowNumber = 4+1=5
                                    curDataRowNumber = curDataRowNumber + 1;
                                    req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                    req.data.CrfStageCode = nextStageData[0].StageCode;

                                    //insert new records for prev stage in Open state in data & flow
                                    //#region  curDataRowNumber =5
                                    //generatedPayload = await approvalfun.getStageAndFlow(curDataRowNumber, req.data);
                                    generatedPayload = await approvalfun.getStageAndFlow(curDataRowNumber, req);
                                    if (generatedPayload != null) {
                                        x = JSON.stringify(generatedPayload);
                                        req.data.ApprovalTransaction.push(JSON.parse(x));
                                    }
                                    else {
                                        throw req.reject('\nError in function getStageAndFlow!!!');
                                    }
                                    //#endregion
                                }
                                //#endregion
                            }
                            //#endregion 

                            //#region NoofRejectionsReq == -1 (special case)
                            else if (curStageNoofRejectionsReq == -1) {
                                //#region
                                //generatedPayload = await approvalfun.updateStageAndFlow(-1, req.data, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, 'REJECTED', null);
                                generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, 'REJECTED', null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw req.reject("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                    req.data.CrfStatus = 'C';
                                    req.data.ApprovalStatus = "REJECTED";
                                }
                                //#endregion
                            }
                            //#endregion
                        }
                        else if (req.data.newApprovalStatus == 'APPROVED') {
                            // if (approved)
                            //check criteria

                            //#region criteria
                            let curDataDetails = await commonfun.getDataFromTable({
                                tableName: 'DData',
                                conditions: [
                                    ['Stage_StageGuid', '=', req.data.Stage_StageGuid],
                                    ['DelMark', '=', '0'],
                                    ['RowStatus', '=', 'OPEN'],
                                    //['Menu_MenuGuid','=',req.data.MMenu_MenuGuid],
                                    ['ObjectGuid', '=', req.data.CrfReqGuid]
                                ],
                                columns: ["TotalApproved", "TotalRejected"]
                            });

                            let TotalApproved = 0;
                            let TotalRejected = 0;

                            if (curDataDetails.length > 0) {

                                //#region var
                                TotalApproved = curDataDetails[0].TotalApproved;
                                TotalRejected = curDataDetails[0].TotalRejected;
                                //#endregion

                            }

                            let ignoreApproval = false;
                            if (curStageNoofApprovalsReq > 0) {
                                //let loginUserRoleType = await commonfun.getLoginUserRoleType(req.data.loginUserID_UserGuid, req.data.Stage_StageGuid);
                                let loginUserRoleType = await commonfun.getLoginUserRoleType(req, req.data.loginUserID_UserGuid);
                                // if (loginUserRoleType == 20) //IGNORE APPROVAL
                                if (!(("0b" + loginUserRoleType >> 1) & 1)) //IGNORE APPROVAL
                                {
                                    ignoreApproval = true;
                                }
                                else if (loginUserRoleType == -1) {
                                    throw req.reject("Please check getLoginUserRoleType!!!");
                                }
                            }
                            //#endregion

                            //#region criteria
                            if ((curStageNoofApprovalsReq >= (TotalApproved + 1)) && (ignoreApproval == false)) {
                                //if criteria= met
                                //criteria 2 = all users in this stage, with ignore approval = false, have approved 
                                let resultsForCriteria = await commonfun.getApprovalStatusForAllUsersOfStage(req);
                                //if criteria 2 = met
                                //update & close stage  
                                //update & close flow & data
                                //if criteria 2  not met
                                //update stage
                                //update flow

                                //#region resultsForCriteria = true
                                if (resultsForCriteria == true) {
                                    curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);

                                    //#region update & close current stage & flow
                                    generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                    if (generatedPayload == null || generatedPayload == undefined) {
                                        throw req.reject("Please check updateStageAndFlow()!!!");
                                    }
                                    else {
                                        x = JSON.stringify(generatedPayload);
                                        req.data.ApprovalTransaction = JSON.parse(x);
                                    }
                                    //#endregion

                                    //set crf stage to next stage
                                    //#region set crf stage to next stage
                                    //const nextStageData = await commonfun.getNextStageGuid(req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                                    const nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                                    if (nextStageData.length > 0) {
                                        req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                        req.data.CrfStageCode = nextStageData[0].StageCode;
                                        curDataRowNumber = curDataRowNumber + 1;
                                        //#region open next stage
                                        //generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req.data, req.data.Stage_StageGuid, 'OPEN', null, null);
                                        generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', null, null);
                                        if (generatedPayload == null || generatedPayload == undefined) {
                                            throw req.reject("Please check updateStageAndFlow()!!!");
                                        }
                                        else {

                                            x = JSON.stringify(generatedPayload);
                                            req.data.ApprovalTransaction = JSON.parse(x);
                                        }
                                        //#endregion
                                    }
                                    else {   //not futher stages. close the form
                                        req.data.CrfStatus = "CLS";
                                        // req.data.Stage_StageGuid = null;
                                        req.data.ApprovalStatus = "APPROVED";
                                        flow.CRF_Done = true;
                                    }
                                    //#endregion

                                }
                                //#endregion resultsForCriteria = true
                                else {
                                    //if criteria = not met
                                    //update stage process date
                                    //update flow approval status for user

                                    //#region update current stage & flow
                                    generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'PARTIALFLOW', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                    if (generatedPayload == null || generatedPayload == undefined) {
                                        throw req.reject("Please check updateStageAndFlow()!!!");
                                    }
                                    else {

                                        x = JSON.stringify(generatedPayload);
                                        req.data.ApprovalTransaction = JSON.parse(x);
                                    }
                                    //#endregion
                                }
                            }
                            //#endregion criteria

                            else if (ignoreApproval == true) {
                                //do not increment approval count. only set status in dataflow
                                //if criteria = not met
                                //update stage process date
                                //update flow approval status for user

                                //#region update current stage & flow
                                //generatedPayload = await approvalfun.updateStageAndFlow(-1, req.data, req.data.Stage_StageGuid, 'PARTIALFLOW', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'PARTIALFLOW', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw req.reject("Please check updateStageAndFlow()!!!");
                                }
                                else {

                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion
                            }

                            else if ((curStageNoofApprovalsReq < (TotalApproved + 1)) && (ignoreApproval == false)) {
                                //if criteria = not met
                                //update stage
                                //update flow

                                //#region update current stage & flow
                                //generatedPayload = await approvalfun.updateStageAndFlow(-1, req.data, req.data.Stage_StageGuid, 'PARTIAL', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                generatedPayload = await approvalfun.updateStageAndFlow(-1, req, req.data.Stage_StageGuid, 'PARTIAL', req.data.loginUserID_UserGuid, 'APPROVED', null);
                                if (generatedPayload == null || generatedPayload == undefined) {
                                    throw req.reject("Please check updateStageAndFlow()!!!");
                                }
                                else {
                                    x = JSON.stringify(generatedPayload);
                                    req.data.ApprovalTransaction = JSON.parse(x);
                                }
                                //#endregion
                            }
                            //#endregion
                        }
                    }
                }

                // console.log( "Request data",JSON.stringify(req.data, null, 2))

                //#endregion
                if (req.event === 'CREATE' && flow?.CRF === true && flow?.CRF_AutoApprove === true) {
                    req.data.CrfStatus = "CLS";
                    req.data.newApprovalStatus = "APPROVED";
                    req.data.newApprovalComment = "Auto Approve";
                    // let closedApprovalTransactions = req.data.ApprovalTransaction.filter(function (item) {
                    //     return item.RowStatus === "CLOSED";
                    // });
                    // req.data.ApprovalTransaction = closedApprovalTransactions  // Rishiraj
                    // return;
                    if (Array.isArray(req.data.ApprovalTransaction)) {
                        req.data.ApprovalTransaction.forEach(function (transaction) {
                            if (transaction.RowStatus === "OPEN") {
                                transaction.RowStatus = "NA";
                                transaction.RowNumber = 0;
                            }

                            if (Array.isArray(transaction.DataFlow)) {
                                transaction.DataFlow.forEach(function (flow) {
                                    if (flow.User_UserGuid === req.data.CreatedByUserID_UserGuid) {
                                        flow.Remarks = "Auto Approved";
                                        transaction.Remarks = "Auto Approved";
                                    }
                                    if (flow.RowStatus === "OPEN") {
                                        flow.RowStatus = "NA"
                                        flow.RowNumber = 0
                                    }
                                });
                            }
                        });
                    }
                    flow.CRF_Done = true;
                }
            }
            catch (error) {
                throw req.error(400, "Error :\n" + error.message);
            }
        }
    });

    service.after(['CREATE', 'UPDATE'], 'TCrfHeader', async (data, req) => {
        try {
            if (req.data.SaveOrSubmit != "SeekAdvice") {
                try {

                    //#region StageWise Mail Sent
                    let { Stage_StageGuid: userStageGuid, Team, CrfReqNo, loginUserID_UserGuid,
                        BuyerCode, ProductCatCode, newApprovalStatus, CrfStatus } = req.data;

                    if (reqStageGuid != req.data.Stage_StageGuid) {
                        if (!userStageGuid)
                            throw new Error("Stage_StageGuid is missing");

                        if (!Team || !Array.isArray(Team))
                            throw new Error("Team data is invalid or missing");

                        // check sendEmail is Y or N if then send mail
                        let isSendEmail = await commonfun.getDataFromTable({
                            tableName: 'MStage',
                            conditions: [
                                ['StageGuid', '=', userStageGuid],
                                ['DelMark', '=', '0']
                            ],
                            columns: ['SendEmail']
                        });

                        if (isSendEmail[0].SendEmail == 'Y') {
                            // Get all roles of the team
                            let teamRole = Team.map(user => user.RoleCode);
                            let teamUser = Team.map(user => user.User_UserGuid);
                            let roledata = await commonfun.getDataFromTable({
                                tableName: 'CStageRole',
                                conditions: [
                                    ['Stage_StageGuid', '=', userStageGuid],
                                    ['RoleCode', 'IN', teamRole],
                                    ['DelMark', '=', '0']
                                ]
                            });

                            // Extract role GUIDs
                            let roleGuids = roledata.map(role => role.Role_RoleGuid);

                            // Fetch users with matching role GUIDs
                            let ListOfUsers = await commonfun.getDataFromTable({
                                tableName: 'MUser',
                                conditions: [
                                    ['Role_RoleGuid', 'IN', roleGuids],
                                    ['UserGuid', 'IN', teamUser],
                                    ['DelMark', '=', '0']
                                ]
                            });
                            let ListOfToUsersEmailId = ListOfUsers.map(user => user.EmailId);
                            let ListOfToUsersGuid = ListOfUsers.map(user => user.UserGuid);

                            // Exclude team role GUIDs in mapping
                            let teamRoleGuid = Team
                                .filter(user => !roleGuids.includes(user.RoleGuid_RoleGuid))
                                .map(user => user.RoleGuid_RoleGuid);

                            let ListOfCcUsers = await commonfun.getDataFromTable({
                                tableName: 'MUser',
                                conditions: [
                                    ['Role_RoleGuid', 'IN', teamRoleGuid],
                                    ['UserGuid', 'IN', teamUser],
                                    ['DelMark', '=', '0']
                                ]
                            });
                            let ListOfCcoUsersEmailId = ListOfCcUsers.map(user => user.EmailId);

                            // Fetch current stage data
                            let currentStageData = await commonfun.getDataFromTable({
                                tableName: 'MStage',
                                conditions: [
                                    ['StageGuid', '=', userStageGuid],
                                    ['DelMark', '=', '0']
                                ]
                            });
                            if (currentStageData.length === 0) throw new Error("Current stage data not found");
                            currentStageCode = currentStageData[0].StageCode;

                            // let meetingDate = req.data.UserAssign.map(item=> item.MeetingStartDate);
                            let meetingDate = req.data.UserAssign.length > 0 ? req.data.UserAssign[0].MeetingStartDate : null;

                            // Convert to a Date object
                            let date = new Date(meetingDate);

                            // Format the date
                            let options = {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true,
                                timeZone: 'UTC' // Optional: Adjust time zone if needed
                            };
                            let formattedDate = date.toLocaleDateString('en-GB', options);
                            // Set placeholders
                            let listOfPlaceholder = {
                                '{{FormNum}}': CrfReqNo || '',
                                '{{MeetingDate}}': formattedDate
                            };

                            // Fetch login user role
                            let loginUserRole = await commonfun.getDataFromTable({
                                tableName: 'MUser',
                                conditions: [
                                    ['UserGuid', '=', loginUserID_UserGuid],
                                    ['DelMark', '=', '0']
                                ],
                                columns: ['Role_RoleGuid', 'Role.RoleCode']
                            });
                            if (loginUserRole.length === 0) throw new Error("Login user role not found");
                            let loginUserRoleCode = loginUserRole[0].Role_RoleCode;

                            if (loginUserRoleCode === "TECHNOLOGIST" &&
                                currentStageCode === "CRF_UPLOAD_DESIGNS" &&
                                newApprovalStatus === "REJECTED") {
                                currentStageCode = "CRF_TECHNOLOGIST_REJECTION";
                            }


                            // Configure email based on stage code CRF_FORM_SUBMISSION
                            const templateMapping = {
                                "CRF_MEETING_SETUP": "CRF_FORM_SUBMISSION",
                                "CRF_UPLOAD_DESIGNS": "CRF_MEETING_NOTES",
                                "CRF_DESIGNS_APPROVAL_PENDING": "CRF_UPLOAD_DESGIN",
                                "CRF_BUYER_APPROVAL_PENDING": "CRF_APPROVAL_TECHNOLOGIST",
                                "CRF_TECHNOLOGIST_REJECTION": "CRF_TECHNOLOGIST_REJECTION"
                            };

                            let TemplateCode = templateMapping[currentStageCode];
                            if (TemplateCode) {
                                // let emailRecipients = currentStageCode === "CRF_APPROVED_DTP_ASSISTANT" ? dtpUsersEmailId : ListOfToUsersEmailId;
                                let docGuid = req.data.CrfReqGuid;
                                let docNum = req.data.CrfReqNo;
                                let menu = req.data.MMenu_MenuGuid;

                                let result = await commonfun.ConfigureMail(TemplateCode, listOfPlaceholder, ListOfToUsersEmailId, ListOfCcoUsersEmailId, docNum, null, null, "CRF");

                                let browserNotify = await commonfun.ConfigureNotification(TemplateCode, docGuid, docNum, menu, ListOfToUsersGuid);

                                try {
                                    const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();
                                    // console.log("Fetched email parent data:", emailParentData);
                                } catch (error) {
                                    console.error('Failed to fetch MEmailParent data:', error);
                                }
                            } else {
                                console.log("Unknown email template for stage code:", currentStageCode);
                            }


                        }
                    }

                    let currentStageData = await commonfun.getDataFromTable({
                        tableName: 'MStage',
                        conditions: [
                            ['StageGuid', '=', req.data.Stage_StageGuid],
                            ['DelMark', '=', '0']
                        ]
                    });

                    // When Merchant user  Final Approved  CRF then send to DTP_ASSISTANT
                    //#region --When Merchant user  Final Approved  CRF then send to DTP_ASSISTANT
                    if (currentStageData[0].StageCode === "CRF_BUYER_APPROVAL_PENDING" &&
                        req.data.newApprovalStatus === "APPROVED" &&
                        req.data.CrfStatus === "CLS"
                    ) {
                        // Fetch DTP Assistant Email IDs
                        let dtpUsers = await commonfun.getDataFromTable({
                            tableName: 'MUser',
                            conditions: [
                                ['Buyer.BuyerCode', '=', BuyerCode],
                                ['ProductCategory.ProductCategoryCode', '=', ProductCatCode],
                                ['Role.RoleCode', '=', "DTP_ASSISTANT"],
                                ['DelMark', '=', '0']
                            ],
                            columns: ['EmailId']
                        });
                        let dtpUsersEmailId = dtpUsers.map(user => user.EmailId);

                        let dtpUsersGuid = dtpUsers.map(user => user.UserGuid);

                        let TemplateCode = "CRF_APPROVED_DTP_ASSISTANT";
                        // Set placeholders
                        let listOfPlaceholder = {
                            '{{FormNum}}': req.data.CrfReqNo || ''
                        };

                        if (TemplateCode) {
                            // let emailRecipients = currentStageCode === "CRF_APPROVED_DTP_ASSISTANT" ? dtpUsersEmailId : ListOfToUsersEmailId;
                            // FOR TNOTIFICATON
                            let docGuid = req.data.CrfReqGuid;
                            let docNum = req.data.CrfReqNo;
                            let menu = req.data.MMenu_MenuGuid;

                            let result = await commonfun.ConfigureMail(TemplateCode, listOfPlaceholder, dtpUsersEmailId, null, docNum, null, null, "CRF");

                            let browserNotify = await commonfun.ConfigureNotification(TemplateCode, docGuid, docNum, menu, dtpUsersGuid);

                            console.log(`Email sent for template: ${TemplateCode}`);

                            try {
                                const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();
                                // console.log("Fetched email parent data:", emailParentData);
                            } catch (error) {
                                console.error('Failed to fetch MEmailParent data:', error);
                            }
                        } else {
                            console.log("Unknown email template for stage code:", currentStageCode);
                        }
                    }
                    //#endregion
                    //#endregion

                    //#region  -- When Merchant Rejected the CRF
                    if (currentStageData[0].StageCode === "CRF_BUYER_APPROVAL_PENDING" &&
                        req.data.newApprovalStatus === "REJECTED" &&
                        req.data.CrfStatus === "C"
                    ) {

                        let listOfPlaceholder = {
                            '{{FormNum}}': req.data.CrfReqNo || ''
                        };

                        let TemplateCode = "CRF_MERCHANT_REJECTION";
                        // Exclude team role GUIDs in mapping
                        let teamUserGuid = req.data.Team
                            .map(user => user.User_UserGuid);

                        let ListOfToUsers = await commonfun.getDataFromTable({
                            tableName: 'MUser',
                            conditions: [
                                ['UserGuid', 'IN', teamUserGuid],
                                ['DelMark', '=', '0']
                            ]
                        });
                        let ListOfToUsersEmailId = ListOfToUsers.map(user => user.EmailId);
                        let ListOfTeamUserGuid = ListOfToUsers.map(user => user.UserGuid);
                        if (TemplateCode) {
                            // let emailRecipients = currentStageCode === "CRF_APPROVED_DTP_ASSISTANT" ? dtpUsersEmailId : ListOfToUsersEmailId;
                            console.log(`Email sent for template: ${TemplateCode}`);
                            // FOR TNOTIFICATON
                            let docGuid = req.data.CrfReqGuid;
                            let docNum = req.data.CrfReqNo;
                            let menu = req.data.MMenu_MenuGuid;

                            let result = await commonfun.ConfigureMail(TemplateCode, listOfPlaceholder, ListOfToUsersEmailId, null, docNum, null, null, "CRF");

                            let browserNotify = await commonfun.ConfigureNotification(TemplateCode, docGuid, docNum, menu, ListOfTeamUserGuid);


                            try {
                                const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();
                                // console.log("Fetched email parent data:", emailParentData);
                            } catch (error) {
                                console.error('Failed to fetch MEmailParent data:', error);
                            }
                        } else {
                            console.log("Unknown email template for stage code:", currentStageCode);
                        }





                    }


                    //#endregion


                    //#region PDRM MEETING

                    // check sendEmail is Y or N if then send mail
                    let meetingStage = await commonfun.getDataFromTable({
                        tableName: 'MStage',
                        conditions: [
                            ['StageGuid', '=', req.data.Stage_StageGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ['StageCode']
                    });

                    let meetingStageCode = meetingStage[0].StageCode;

                    if (meetingStageCode === 'CRF_MEETING_SETUP' && req.data.UserAssign != null && (!Array.isArray(req.data.UserAssign) || req.data.UserAssign.length > 0) && reqStageGuid != null && reqStageGuid !== '') {

                        // check sendEmail is Y or N if then send mail
                        let isSendEmail = await commonfun.getDataFromTable({
                            tableName: 'MStage',
                            conditions: [
                                ['StageGuid', '=', req.data.Stage_StageGuid],
                                ['DelMark', '=', '0']
                            ],
                            columns: ['SendEmail']
                        });
                        if (isSendEmail[0].SendEmail == 'Y') {

                            let callMeetingNoUserEmail = req.data.UserAssign
                                .filter(item => item.SendEmail === "Y" && item.CallMeeting === "N")
                                .map(item => item.UserEmailId);

                            let callMeetingYesUserEmail = req.data.UserAssign
                                .filter(item => item.SendEmail === "Y" && item.CallMeeting === "Y")
                                .map(item => item.UserEmailId);

                            // for TNotification
                            let callMeetingNoUserGuid = req.data.UserAssign
                                .filter(item => item.SendEmail === "Y" && item.CallMeeting === "N")
                                .map(item => item.UserID_UserGuid);

                            let callMeetingYesUserGuid = req.data.UserAssign
                                .filter(item => item.SendEmail === "Y" && item.CallMeeting === "Y")
                                .map(item => item.UserID_UserGuid);

                            let meetingStartDate = req.data.UserAssign.find(item => item.MeetingStartDate)?.MeetingStartDate;

                            console.log(meetingStartDate);

                            // Convert to a Date object
                            let date = new Date(meetingStartDate);

                            // Format the date
                            let options = {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true,
                                timeZone: 'UTC' // Optional: Adjust time zone if needed
                            };
                            let formattedDate = date.toLocaleDateString('en-GB', options);

                            console.log(formattedDate); // Output: 8 January 2025

                            let callMeetingNoTemplate = "CRF_CALL_MEETING_NO";
                            let callMeetingYesTemplate = "CRF_CALL_MEETING_YES";

                            if (callMeetingNoUserEmail != null && callMeetingNoUserEmail.length > 0) {
                                if (callMeetingNoTemplate == "CRF_CALL_MEETING_NO") {
                                    let listOfPlaceholder = {
                                        '{{FormNum}}': CrfReqNo || '',
                                        '{{MeetingDate}}': formattedDate
                                    };

                                    // Tnotification
                                    let docGuid = req.data.CrfReqGuid;
                                    let docNum = req.data.CrfReqNo;
                                    let menu = req.data.MMenu_MenuGuid;

                                    let result = await commonfun.ConfigureMail(callMeetingNoTemplate, listOfPlaceholder, callMeetingNoUserEmail, null, docNum, null, null, "CRF");

                                    let browserNotify = await commonfun.ConfigureNotification(callMeetingNoTemplate, docGuid, docNum, menu, callMeetingNoUserGuid);


                                    console.log(`Email sent for template: ${callMeetingNoTemplate}`);

                                    try {
                                        const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();

                                        const updateData = {
                                            SendEmail: 'N'
                                        };
                                        try {
                                            // Perform the update using cds.update
                                            await cds.update('STONEMEN_CCRFMEETINGDETAIL')
                                                .set(updateData)
                                                .where({ PARENT_CRFREQGUID: req.data.CrfReqGuid });

                                            console.log(`Updated STONEMEN_CCRFMEETINGDETAIL: ${req.data.CrfReqGuid} SendEmail 'N'`);
                                        } catch (error) {
                                            console.error('Error updating status:', error);
                                        }
                                        // console.log("Fetched email parent data:", emailParentData);
                                    } catch (error) {
                                        console.error('Failed to fetch MEmailParent data:', error);
                                    }
                                }
                            }

                            if (callMeetingYesUserEmail != null && callMeetingYesUserEmail.length > 0) {
                                if (callMeetingYesTemplate == "CRF_CALL_MEETING_YES") {

                                    let listOfPlaceholder = {
                                        '{{FormNum}}': CrfReqNo || '',
                                        '{{MeetingDate}}': formattedDate
                                    };
                                    // Tnotification
                                    let docGuid = req.data.CrfReqGuid;
                                    let docNum = req.data.CrfReqNo;
                                    let menu = req.data.MMenu_MenuGuid;

                                    let result = await commonfun.ConfigureMail(callMeetingYesTemplate, listOfPlaceholder, callMeetingYesUserEmail, null, docNum, null, null, "CRF");

                                    let browserNotify = await commonfun.ConfigureNotification(callMeetingYesTemplate, docGuid, docNum, menu, callMeetingYesUserGuid);

                                    console.log(`Email sent for template: ${callMeetingYesTemplate}`);

                                    try {
                                        const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();
                                        const updateData = {
                                            SendEmail: 'N'
                                        };
                                        try {
                                            // Perform the update using cds.update
                                            await cds.update('STONEMEN_CCRFMEETINGDETAIL')
                                                .set(updateData)
                                                .where({ PARENT_CRFREQGUID: req.data.CrfReqGuid });

                                            console.log(`Updated STONEMEN_CCRFMEETINGDETAIL: ${req.data.CrfReqGuid} SendEmail 'N'`);
                                        } catch (error) {
                                            console.error('Error updating status:', error);
                                        }
                                        // console.log("Fetched email parent data:", emailParentData);
                                    } catch (error) {
                                        console.error('Failed to fetch MEmailParent data:', error);
                                    }

                                }

                            }

                        }
                    }

                    //#endregion

                    //#endregion

                    //#endregion Generate Category unique number 
                    if (req.event == "CREATE") {
                        // #region Get Data from MProductCatagory and generate category code
                        const ProductCatagoryData = await SELECT.one.from(MProductCategory).where({ ProductCategoryGuid: req.data.ProductCatGuid_ProductCategoryGuid });
                        if (!ProductCatagoryData) {
                            throw req.error("Error: On auto generate Unique Category no.");
                        }
                        const result = await db.run(SELECT.from(TCrfHeader).columns([{ func: 'count', args: ['*'], as: 'count' }]).where({
                            ProductCatCode: ProductCatagoryData.ProductCategoryCode
                        })
                        );
                        const data = result[0].count
                        const CategoryUniqueNum = await commonfun.generateCategoryUniqueNum(ProductCatagoryData, result);
                        const updatedRows = await db.run(UPDATE(TCrfHeader).set({
                            CategoryUniqueNum: CategoryUniqueNum

                        }).where({
                            CrfReqNo: req.data.CrfReqNo
                        })
                        );
                        //#endregion
                        let aPDN = null;
                        if (typeof (CategoryUniqueNum) == 'number') {
                            aPDN = CategoryUniqueNum;
                        } else {
                            let ProductNoValue = CategoryUniqueNum.match(/\d+/);
                            // aPDN = ProductNoValue ? parseInt(ProductNoValue[0]) : null
                            aPDN = ProductNoValue ? ProductNoValue[0] : null
                        }
                        const UpdateResult = await db.run(UPDATE(MProductCategory).set({

                            LastNum: aPDN

                        }).where({
                            ProductCategoryGuid: req.data.ProductCatGuid_ProductCategoryGuid
                        })
                        );

                    }
                    //#endregion
                } catch (error) {
                    console.error("Error in TCrfHeader service after hook:", error.message);
                    throw error; // Optional: Rethrow to notify the caller
                }
            }
            else {
                //#region Seek advice
                if (req.data.SeekAdvice !== null && req.data.SeekAdvice !== undefined && (!Array.isArray(req.data.SeekAdvice) || req.data.SeekAdvice.length > 0)) {
                    let seekAdviceQuestion = req.data.SeekAdvice
                        .filter(item => item.SendEmailQuestion === 'Y') // Filter items where SendEmailQuestion is 'Y'
                        .map(item => ({
                            ...item // Map all properties of the filtered item
                        }));

                    let seekAdviceAnswer = req.data.SeekAdvice
                        .filter(item => item.SendEmailAnswer === 'Y') // Filter items where SendEmailQuestion is 'Y'
                        .map(item => ({
                            ...item // Map all properties of the filtered item
                        }));

                    seekAdviceAnswerToUserGuid = seekAdviceAnswer.map(item => item.QuestionFromUser_UserGuid);

                    seekAdviceQuestionToUserGuid = seekAdviceQuestion.map(item => item.QuestionToUser_UserGuid);

                    // question TO user
                    let seekAdviceQueUsers = await commonfun.getDataFromTable({
                        tableName: 'MUser',
                        conditions: [
                            ['UserGuid', 'IN', seekAdviceQuestionToUserGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ['EmailId']
                    });

                    // Anserwer To user
                    let seekAdviceAnsUsers = await commonfun.getDataFromTable({
                        tableName: 'MUser',
                        conditions: [
                            ['UserGuid', 'IN', seekAdviceAnswerToUserGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ['EmailId']
                    });

                    let seekAdviceAnsUsersEmailId = seekAdviceAnsUsers.map(user => user.EmailId);
                    let seekAdviceQueUsersEmailId = seekAdviceQueUsers.map(user => user.EmailId);

                    let seekAdviceAnsUserGuid = seekAdviceAnsUsers.map(user => user.UserGuid);
                    let seekAdviceQueUserGuid = seekAdviceQueUsers.map(user => user.UserGuid);

                    let seekAdviceQueTemplate = "CRF_SEEK_ADVICE_QUESTION";
                    let seekAdviceAnsTemplate = "CRF_SEEK_ADVICE_ANSWER";

                    let loginUserDetail = await commonfun.getDataFromTable({
                        tableName: 'MUser',
                        conditions: [
                            ['UserGuid', '=', req.data.loginUserID_UserGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ['UserName', 'EmailId']
                    });

                    let loginUserName = loginUserDetail[0].UserName;
                    let loginEmail = loginUserDetail[0].EmailId;


                    // Seek advice
                    if (seekAdviceQueTemplate == "CRF_SEEK_ADVICE_QUESTION") {
                        // Set placeholders
                        let listOfPlaceholder = {
                            '{{FormNum}}': req.data.CrfReqNo || '',
                            '{{QueryInitiator}}': loginUserName
                        };

                        // Tnotification
                        let docGuid = req.data.CrfReqGuid;
                        let docNum = req.data.CrfReqNo;
                        let menu = req.data.MMenu_MenuGuid;

                        let result = await commonfun.ConfigureMail(seekAdviceQueTemplate, listOfPlaceholder, seekAdviceQueUsersEmailId, null, docNum, null, null, "CRF");

                        let browserNotify = await commonfun.ConfigureNotification(seekAdviceQueTemplate, docGuid, docNum, menu, seekAdviceQueUserGuid);


                        console.log(`Email sent for template: ${seekAdviceQueTemplate}`);

                        try {
                            const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();
                            const updateData = {
                                SendEmailQuestion: 'N'
                            };
                            try {
                                // Perform the update using cds.update
                                await cds.update('STONEMEN_CCRFSEEKADVICE')
                                    .set(updateData)
                                    .where({ PARENT_CRFREQGUID: req.data.CrfReqGuid });

                                console.log(`Updated STONEMEN_CCRFSEEKADVICE: ${req.data.CrfReqGuid} SendEmailQuestion 'N'`);
                            } catch (error) {
                                console.error('Error updating status:', error);
                            }
                            // console.log("Fetched email parent data:", emailParentData);
                        } catch (error) {
                            console.error('Failed to fetch MEmailParent data:', error);
                        }
                    }
                    if (seekAdviceAnsTemplate == "CRF_SEEK_ADVICE_ANSWER") {
                        // Set placeholders
                        let listOfPlaceholder = {
                            '{{FormNum}}': req.data.CrfReqNo || '',
                            '{{AnswerUser}}': loginUserName
                        };

                        // Tnotification
                        let docGuid = req.data.CrfReqGuid;
                        let docNum = req.data.CrfReqNo;
                        let menu = req.data.MMenu_MenuGuid;

                        let result = await commonfun.ConfigureMail(seekAdviceAnsTemplate, listOfPlaceholder, seekAdviceAnsUsersEmailId, null, docNum, null, null, "CRF");

                        let browserNotify = await commonfun.ConfigureNotification(seekAdviceAnsTemplate, docGuid, docNum, menu, seekAdviceAnsUserGuid);

                        console.log(`Email sent for template: ${seekAdviceAnsTemplate}`);

                        try {
                            const emailParentData = await commonfun.sendEmailFromEmailParentAndChild();

                            const updateData = {
                                SendEmailAnswer: 'N'
                            };
                            try {
                                // Perform the update using cds.update
                                await cds.update('STONEMEN_CCRFSEEKADVICE')
                                    .set(updateData)
                                    .where({ PARENT_CRFREQGUID: req.data.CrfReqGuid });

                                console.log(`Updated STONEMEN_CCRFSEEKADVICE: ${req.data.CrfReqGuid} SendEmailQuestion 'N'`);
                            } catch (error) {
                                console.error('Error updating status:', error);
                            }
                            // console.log("Fetched email parent data:", emailParentData);
                        } catch (error) {
                            console.error('Failed to fetch MEmailParent data:', error);
                        }
                    }

                }
                //#endregion

            }

            // for flow 
            // await processFlow(req,flow);
            // delete req.data.CrfReqDate;
            // req.data.CrfReqDate = new Date().toISOString() 
            if (!flow) {
                flow = commonfun.decodeFlowCode(req.data.FlowCode);
                const errorlog = {
                    docHeaderGuid: req.data.CrfReqGuid,
                    docHeaderNo: req.data.CrfReqNo,
                    docDetailGuid: null,
                    S4API: null,
                    APICode: req.data.FlowCode,
                    errCode: "Flow crash",
                    errMessage: "Flow not Found and New flow fatch",
                    Remarks: "Check FLow in CRF After Section",
                    MenuName: "FormFlow"
                }
                console.log("errorlog", errorlog);
                const reslt = await INSERT.into(ErrorLog).entries(errorlog);
            }
            // if (flow.CRF_Done) {
            if (req.data.CrfStatus == "CLS") {
                let CadPayload = null
                if (flow.CAD) {
                    CadPayload = await mapCrfToCad(req.data)
                }
                if (flow.CAD_AutoApprove && flow.CAD) {
                    CadPayload.CadStatus = "CLS"
                    CadPayload.newApprovalStatus = "APPROVED"
                    CadPayload.newApprovalComment = "Auto Approve"
                    flow.CAD_Done = true
                }
                if (CadPayload) {
                    const cadService = await cds.connect.to('StonemanCADService');
                    let a = await cadService.run(
                        INSERT.into('StonemanCADService.TCadDetail').entries(CadPayload)
                    );
                    console.log(a)
                }
                // flow.CAD_Done = true
            }
            if (req.data.CrfStatus == "CLS" && !flow.CAD) {
                let COPPayload = null
                if (flow.COP) {
                    COPPayload = await mapCrfToCop(req.data)
                }
                if (flow.COP && flow.COP_AutoApprove) {
                    COPPayload.FormStatus = "CLS"
                    COPPayload.newApprovalStatus = "APPROVED"
                    COPPayload.newApprovalComment = "Auto Approve"
                    flow.COP_Done = true
                }
                if (COPPayload) {
                    const COPService = await cds.connect.to('StonemanCOPService');
                    await COPService.run(
                        INSERT.into('StonemanCOPService.TCostingHeader').entries(COPPayload)
                    );
                    // flow.COP_Done = true
                }
            }

            console.log(flow);

            // let crfPayload = req.data
            // if (crfPayload.CrfStatus === "CLS" && crfPayload.newApprovalStatus === "APPROVED" && crfPayload.CrfCategory === "CAD" &&
            //     crfPayload.OnlycostingRequired === false) {
            //     let CadPayload = await mapCrfToCad(crfPayload)
            //     const cadService = await cds.connect.to('StonemanCADService');
            //     let aUploadFileResponse = await cadService.run(
            //         INSERT.into('StonemanCADService.TCadDetail').entries(CadPayload)
            //     );
            //     console.log("CAD Post", CadPayload)
            // }
            // if (
            //     (crfPayload.CrfStatus === "CLS" && crfPayload.CrfCategory === "Rendering") ||
            //     (crfPayload.CrfStatus === "CLS" &&
            //         crfPayload.newApprovalStatus === "APPROVED" &&
            //         crfPayload.CrfCategory === "CAD" &&
            //         crfPayload.OnlycostingRequired === true)
            // ) {
            //     let COPPayload = await mapCrfToCop(crfPayload)
            //     const COPService = await cds.connect.to('StonemanCOPService');
            //     let aUploadFileResponse = await COPService.run(
            //         INSERT.into('StonemanCOPService.TCostingHeader').entries(COPPayload)
            //     );
            //     console.log("COP Post", aUploadFileResponse)
            // }
        }
        catch (error) {
            console.error("Error in TCrfHeader service after hook:", error.message);
            throw error; // Optional: Rethrow to notify the caller

        }

    });

    async function mapCrfToCad(crfPayload, req) {
        try {
            //  Basic validation
            if (!crfPayload || typeof crfPayload !== 'object') {
                throw req.reject(400, "Invalid CRF payload!");
            }

            if (!crfPayload.CrfReqGuid) {
                throw req.reject(400, "CrfReqGuid is required in CRF payload!");
            }

            //  Menu details validation
            let curMenuDetails = await commonfun.getDataFromTable({
                tableName: 'MMenu',
                conditions: [
                    ['MenuCode', '=', 'CAD'],
                    ['DelMark', '=', '0']
                ],
                columns: ["MenuGuid"]
            });

            if (!curMenuDetails || curMenuDetails.length === 0) {
                throw req.reject(404, "CAD form Menu with Code (CAD) is not defined!");
            }
            crfPayload.MMenu_MenuGuid = curMenuDetails[0].MenuGuid;

            //  Template fetch validation
            let TemplatePayload = { MenuSubType: "CAD", MenuCode: "CAD" };
            let Template = await service.send("GetTemplate", TemplatePayload);

            if (!Template || Template.length === 0) {
                throw req.reject(404, "Template for CAD is not available!");
            }

            // all CRF Role and stage 
            const AllStageForCRF = await commonfun.getDataFromTable({
                tableName: 'CTemplateStage',
                conditions: [
                    ['Parent_TemplateGuid', '=', crfPayload.Template_TemplateGuid],
                ],
                columns: ["Stage_StageGuid"]
            });
            //#endregion

            //#region get all roles
            let AllRoleForAllStageOfCRF = [];
            for (let i = 0; i < AllStageForCRF.length; i++) {

                //get next stage for this template
                //trupti
                let tempStage = await commonfun.getNextStageGuid(req, crfPayload.Template_TemplateGuid, AllStageForCRF[i].Stage_StageGuid);
                let roleOfThisStageGuid = null;

                //final stage 
                if (tempStage.length == 0) {
                    //get role of user who created crf 
                    createdByUserRoleGuid = await commonfun.getDataFromTable({
                        tableName: 'MUser',
                        conditions: [
                            ['UserGuid', '=', crfPayload.CreatedByUserID_UserGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["Role_RoleGuid"]
                    });

                    //this is the last stage
                    roleOfThisStageGuid = await commonfun.getDataFromTable({
                        tableName: 'CStageRole',
                        conditions: [
                            ['Stage_StageGuid', '=', AllStageForCRF[i].Stage_StageGuid],
                            ['Role_RoleGuid', '=', createdByUserRoleGuid[0].Role_RoleGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                    });
                }
                else {
                    roleOfThisStageGuid = await commonfun.getDataFromTable({
                        tableName: 'CStageRole',
                        conditions: [
                            ['Stage_StageGuid', '=', AllStageForCRF[i].Stage_StageGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                    });
                }

                if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                    AllRoleForAllStageOfCRF = AllRoleForAllStageOfCRF.concat(roleOfThisStageGuid); // Flatten the array
                }
            }
            console.log("AllRoleForAllStageOfCRF", AllRoleForAllStageOfCRF)
            //  Build CAD payload
            return {
                CrfReqUUID_CrfReqGuid: crfPayload.CrfReqGuid,
                CadStatus: "AutoDraft",
                MMenu_MenuGuid: crfPayload.MMenu_MenuGuid,
                Template_TemplateGuid: Template[0].TEMPLATEGUID,
                ProductCatGuid_ProductCategoryGuid: crfPayload.ProductCatGuid_ProductCategoryGuid,
                ApprStatus: "N/A",
                SaveOrSubmit: "Draft",
                // createdBy: crfPayload.CreatedBy || "system",
                // modifiedBy: crfPayload.CreatedBy || "system",
                //                 // createdAt: new Date().toISOString(),
                // modifiedAt: new Date().toISOString(),
                MainAttachment: crfPayload.MainAttachment
                    ? {
                        
                        StageCode: crfPayload.MainAttachment.StageCode,
                        Stage_StageGuid: crfPayload.MainAttachment.Stage_StageGuid,
                        User_UserGuid: crfPayload.MainAttachment.User_UserGuid,

                        // Nested Attachment mapped exactly
                        Attachment: crfPayload.MainAttachment.Attachment
                            ? {
                               
                                AttachmentName: crfPayload.MainAttachment.Attachment.AttachmentName,
                                OrgFileExtension: crfPayload.MainAttachment.Attachment.OrgFileExtension,
                                OrgFileName: crfPayload.MainAttachment.Attachment.OrgFileName,
                                ReferenceGuid: crfPayload.MainAttachment.Attachment.ReferenceGuid,
                                ReferenceId: crfPayload.MainAttachment.Attachment.ReferenceId,
                                ReferenceType: crfPayload.MainAttachment.Attachment.ReferenceType,
                                Remarks: crfPayload.MainAttachment.Attachment.Remarks,
                                SysFileExtension: crfPayload.MainAttachment.Attachment.SysFileExtension,
                                SysFileName: crfPayload.MainAttachment.Attachment.SysFileName,
                                SysFilePath: crfPayload.MainAttachment.Attachment.SysFilePath,
                                UploadedOnCloud: crfPayload.MainAttachment.Attachment.UploadedOnCloud,
                                dmsFileExtension: crfPayload.MainAttachment.Attachment.dmsFileExtension,
                                dmsFileId: crfPayload.MainAttachment.Attachment.dmsFileId,
                                dmsFileName: crfPayload.MainAttachment.Attachment.dmsFileName,
                                dmsFolderPath: crfPayload.MainAttachment.Attachment.dmsFolderPath,
                                dmsRepoId: crfPayload.MainAttachment.Attachment.dmsRepoId
                            }
                            : null
                    }
                    : null,
                // 🔹 Team Mapping
                Team: (crfPayload.Team || [])
                    .filter(t =>
                        AllRoleForAllStageOfCRF.some(r => r.Role_RoleGuid === t.RoleGuid_RoleGuid)
                    )
                    .map(t => ({
                        ProductCategoryCode: t.ProductCategoryCode,
                        ProductCategoryName: t.ProductCategoryName,
                        UserMaterialCategoryCode: t.UserMaterialCategoryCode,
                        UserMaterialCategoryName: t.UserMaterialCategoryName,
                        User_UserGuid: t.User_UserGuid,
                        ProductCatGuid_ProductCategoryGuid: t.ProductCatGuid_ProductCategoryGuid,
                        UserName: t.UserName,
                        RoleGuid_RoleGuid: t.RoleGuid_RoleGuid
                    })),

                // 🔹 InspDraw Mapping
                InspDraw: (crfPayload.InspDraw || []).map((d, index) => ({
                    StageCode: d.StageCode,
                    ApprovalStatus: d.ApprovalStatus || "PENDING",
                    Remarks: d.Remarks,
                    User_UserGuid: d.User_UserGuid,
                    RowNumber: index + 1,
                    RowStatus: d.RowStatus,
                    // createdAt: new Date().toISOString(),
                    // createdBy: crfPayload.CreatedBy || "system",
                    // modifiedAt: new Date().toISOString(),
                    // modifiedBy: crfPayload.CreatedBy || "system",
                    Attachment: (d.Attachment || []).map(a => ({
                        AttachmentName: a.AttachmentName,
                        OrgFileName: a.OrgFileName,
                        OrgFileExtension: a.OrgFileExtension,
                        SysFileName: a.SysFileName,
                        SysFileExtension: a.SysFileExtension,
                        ReferenceType: a.ReferenceType,
                        ReferenceId: a.ReferenceId,
                        SysFilePath: a.SysFilePath,
                        UploadedOnCloud: a.UploadedOnCloud || "N",
                        DelMark: a.DelMark || 0,
                        Remarks: a.Remarks,
                        dmsFileId: a.dmsFileId,
                        dmsFileName: a.dmsFileName,
                        dmsFileExtension: a.dmsFileExtension,
                        dmsFolderPath: a.dmsFolderPath,
                        dmsRepoId: a.dmsRepoId,
                        // createdAt: new Date().toISOString(),
                        // createdBy: crfPayload.CreatedBy || "system",
                        // modifiedAt: new Date().toISOString(),
                        // modifiedBy: crfPayload.CreatedBy || "system"
                    }))
                })),

                // 🔹 Material Mapping
                Material: (crfPayload.Material || []).map((m, idx) => ({
                    MaterialAutoCode: m.MaterialAutoCode,
                    MaterialCatHanaText: m.MaterialCatHanaText,
                    MaterialCatFreeText: m.MaterialCatFreeText,
                    Remarks: m.UserComments,
                    TestProtocol: m.TestProtocol,

                    RowNumber: idx + 1,   // ensure sequential numbering
                    createdAt: new Date().toISOString(),
                    createdBy: crfPayload.CreatedBy || "system",
                    modifiedAt: new Date().toISOString(),
                    modifiedBy: crfPayload.CreatedBy || "system"
                }))
            };
        } catch (error) {
            console.error("Error in mapCrfToCad:", error);
            if (req) {
                throw req.reject(500, error.message || "Error while mapping CRF to CAD payload!");
            }
            throw error;
        }
    }

    async function mapCrfToCop(crfPayload, req) {
        try {
            if (!crfPayload || typeof crfPayload !== "object") {
                throw req.reject(400, "Invalid CRF payload!");
            }

            if (!crfPayload.CrfReqGuid) {
                throw req.reject(400, "CrfReqGuid is required!");
            }
            const categories = (crfPayload.MCatName || "").split("+");

            // ----------------------------------------------------------
            // 1. Get COST Menu Guid
            // ----------------------------------------------------------
            const menuRows = await commonfun.getDataFromTable({
                tableName: "MMenu",
                conditions: [
                    ["MenuCode", "=", "COST"],
                    ["DelMark", "=", "0"]
                ],
                columns: ["MenuGuid"]
            });

            if (!menuRows?.length) {
                throw req.reject(404, "COST Menu not configured!");
            }

            const menuGuid = menuRows[0].MenuGuid;

            // ----------------------------------------------------------
            // 2. Get COST Template
            // ----------------------------------------------------------
            // const TemplatePayload = { MenuSubType: "COST", MenuCode: "COST" };
            const Template = await commonfun.getDataFromTable({
                tableName: 'CTemplateMenu',
                conditions: [
                    ['MenuCode', '=', 'COST'],
                    ['MenuSubType', '=', 'CAD']
                ],
                columns: ['Parent_TemplateGuid as TEMPLATEGUID']
            });

            if (!Template?.length) {
                throw req.reject(404, "COST Template not available!");
            }

            const templateGuid = Template[0].TEMPLATEGUID || Template[0].TemplateGuid;

            // ----------------------------------------------------------
            // 3. Build COP Payload
            // ----------------------------------------------------------
            const now = new Date().toISOString();

            const copPayload = {
                // ---------- Main Header ----------
                CrfReqUUID_CrfReqGuid: crfPayload.CrfReqGuid,
                CrfReqNo: crfPayload.CrfReqNo,
                CrfReqDate: crfPayload.CrfReqDate,
                CrfDelDate: crfPayload.CrfDelDate,
                OldCrfReqNo: crfPayload.OldCrfReqNo,
                EstCostInDocCur: crfPayload.EstCostInDocCur,
                EstCostInINR: crfPayload.EstCostInINR,

                ProductCategory: crfPayload.ProductCatName,
                CategoryCode: crfPayload.ProductCatCode,
                CategoryUniqueNum: crfPayload.CategoryUniqueNum,
                SubCatName: crfPayload.SubCatName,
                CostingType: crfPayload.CostingType,

                CADUUID_CadDetailUUID: crfPayload.CADUUID,
                CADNo: crfPayload.CADNo,
                CADLevel: crfPayload.CADLevel,
                MCatCode: crfPayload.MCatCode,
                MCatName: crfPayload.MCatName,
                MerReqDate: crfPayload.MerReqDate,

                BuyerCode: crfPayload.BuyerCode,
                BuyerName: crfPayload.BuyerName,
                BuyerCur: crfPayload.BuyerCur,
                BrandName: crfPayload.BrandName,

                ItemDesc: crfPayload.ItemDescription || crfPayload.ItemDesc,
                Reamrks: crfPayload.Reamrks || crfPayload.Reamrks,
                Diameter: crfPayload.Diameter,
                Length: crfPayload.Length ?? null,
                Width: crfPayload.Width ?? null,
                Height: crfPayload.Height ?? null,
                UnitCode: crfPayload.UnitCode ?? null,
                UnitName: crfPayload.UnitName ?? null,

                MenuCode: "COST",
                MMenu_MenuGuid: menuGuid,
                Template_TemplateGuid: templateGuid,

                FormType: "COSTINGPAGER",
                FormStatus: "AutoDraft",
                SaveOrSubmit: crfPayload.SaveOrSubmit || "SUBMIT",

                CrfCategory: "Rendering",
                ReqTyp: crfPayload.ReqTyp,
                PDDate: crfPayload.PDDate,
                PDNo: crfPayload.PDNo,

                // createdAt: now,
                // modifiedAt: now,
                // createdBy: crfPayload.CreatedBy || "anonymous",
                // modifiedBy: crfPayload.CreatedBy || "anonymous",

                // ---------- Default System Fields ----------
                ApprStatus: "NA",
                ApprComments: null,
                // ExtraCharges_CostingExtraChargesUUID: commonfun.uuid(),
                // MainAssembly_CostingMainAssemblyUUID: commonfun.uuid(),
                // Metal_CostingMetalUUID: commonfun.uuid(),
                // Stone_CostingStoneUUID: commonfun.uuid(),
                // Wood_CostingWoodUUID: commonfun.uuid(),
                // Other_CostingOtherMaterialUUID: commonfun.uuid(),
                // Accessories_CostingAccessoriesUUID: commonfun.uuid(),
                // Packaging_CostingPackagingUUID: commonfun.uuid(),

                // ---------- Team ----------
                 MainAttachment: crfPayload.MainAttachment
                    ? {
                        
                        StageCode: crfPayload.MainAttachment.StageCode,
                        Stage_StageGuid: crfPayload.MainAttachment.Stage_StageGuid,
                        User_UserGuid: crfPayload.MainAttachment.User_UserGuid,

                        // Nested Attachment mapped exactly
                        Attachment: crfPayload.MainAttachment.Attachment
                            ? {
                               
                                AttachmentName: crfPayload.MainAttachment.Attachment.AttachmentName,
                                OrgFileExtension: crfPayload.MainAttachment.Attachment.OrgFileExtension,
                                OrgFileName: crfPayload.MainAttachment.Attachment.OrgFileName,
                                ReferenceGuid: crfPayload.MainAttachment.Attachment.ReferenceGuid,
                                ReferenceId: crfPayload.MainAttachment.Attachment.ReferenceId,
                                ReferenceType: crfPayload.MainAttachment.Attachment.ReferenceType,
                                Remarks: crfPayload.MainAttachment.Attachment.Remarks,
                                SysFileExtension: crfPayload.MainAttachment.Attachment.SysFileExtension,
                                SysFileName: crfPayload.MainAttachment.Attachment.SysFileName,
                                SysFilePath: crfPayload.MainAttachment.Attachment.SysFilePath,
                                UploadedOnCloud: crfPayload.MainAttachment.Attachment.UploadedOnCloud,
                                dmsFileExtension: crfPayload.MainAttachment.Attachment.dmsFileExtension,
                                dmsFileId: crfPayload.MainAttachment.Attachment.dmsFileId,
                                dmsFileName: crfPayload.MainAttachment.Attachment.dmsFileName,
                                dmsFolderPath: crfPayload.MainAttachment.Attachment.dmsFolderPath,
                                dmsRepoId: crfPayload.MainAttachment.Attachment.dmsRepoId
                            }
                            : null
                    }
                    : null,
               
                Team: (crfPayload.Team || []).map((t, idx) => ({
                    // CostingTeamGuid: commonfun.uuid(),
                    User_UserGuid: t.User_UserGuid,
                    UserName: t.UserName,
                    RoleGuid_RoleGuid: t.RoleGuid_RoleGuid,
                    RoleCode: t.RoleCode,
                    ProductCategoryCode: t.ProductCategoryCode,
                    ProductCategoryName: t.ProductCategoryName,
                    UserMaterialCategoryCode: t.UserMaterialCategoryCode,
                    UserMaterialCategoryName: t.UserMaterialCategoryName,
                    DepartmentName: t.DepartmentName,
                    SubDepartmentName: t.SubDepartmentName,
                    RowNumber: idx + 1,
                    MenuName: "CAD"
                    // DelMark: 0,
                    // createdAt: now,
                    // modifiedAt: now,
                    // createdBy: crfPayload.CreatedBy || "anonymous",
                    // modifiedBy: crfPayload.CreatedBy || "anonymous"
                })),

                // ---------- InspDraw ----------
                InspDraw: (crfPayload.InspDraw || []).map((d, i) => ({
                    // CostingAttachmentsGuid: commonfun.uuid(),
                    RowNumber: i + 1,
                    ApprovalStatus: "NA",
                    Remarks: d.Remarks,
                    RowStatus: d.RowStatus,
                    StageCode: d.StageCode,
                    Stage_StageGuid: d.Stage_StageGuid,
                    User_UserGuid: d.User_UserGuid,
                    AttachmentRemarks: d.AttachmentRemarks,
                    // DelMark: 0,
                    // createdAt: now,
                    // modifiedAt: now,
                    // createdBy: crfPayload.CreatedBy || "anonymous",
                    // modifiedBy: crfPayload.CreatedBy || "anonymous",

                    Attachment: (d.Attachment || []).map(a => ({
                        // AttachmentGuId: a.AttachmentGuId,
                        AttachmentName: a.AttachmentName,
                        OrgFileName: a.OrgFileName,
                        OrgFileExtension: a.OrgFileExtension,
                        SysFileName: a.SysFileName,
                        SysFileExtension: a.SysFileExtension,
                        SysFilePath: a.SysFilePath,
                        UploadedOnCloud: a.UploadedOnCloud || "Y",
                        Remarks: a.Remarks,
                        ReferenceGuid: a.ReferenceGuid,
                        ReferenceType: a.ReferenceType,
                        // DelMark: 0,
                        dmsFileId: a.dmsFileId,
                        dmsFileName: a.dmsFileName,
                        dmsFileExtension: a.dmsFileExtension,
                        dmsFolderPath: a.dmsFolderPath,
                        dmsRepoId: a.dmsRepoId
                    }))
                })),

                // ---------- Material Category ----------
                MaterialCategory: (crfPayload.Material || []).map((m, idx) => ({
                    MaterialCategoryCode: m.MaterialAutoCode ?? null,
                    MaterialCategoryName: m.MaterialCatHanaText ?? null,
                    MaterialCatFreeText: m.MaterialCatFreeText ?? null,
                    Remarks: m.UserComments ?? null,
                    DelMark: 0,
                    RowNumber: idx + 1

                })),

                // ---------- Material Details ----------
                // MaterialDetails: (crfPayload.Material || []).map(m => ({
                //     // CopMaterialGuid: commonfun.uuid(),
                //     MaterialCategoryCode: m.MaterialAutoCode,
                //     MaterialCategoryName: m.MaterialCatFreeText,
                //     MaterialCategoryType: m.TestProtocol
                //     // createdAt: now,
                //     // modifiedAt: now,
                //     // createdBy: crfPayload.CreatedBy || "anonymous",
                //     // modifiedBy: crfPayload.CreatedBy || "anonymous"
                // })),
                MaterialDetails: [
                    {

                        MaterialCategoryCode: "59",
                        MaterialCategoryName: "Packing",
                        MaterialCategoryType: "ZRMP"
                    },
                    {

                        MaterialCategoryCode: "58",
                        MaterialCategoryName: "Accessories",
                        MaterialCategoryType: "ZRMA"
                    },
                    {

                        MaterialCategoryCode: "45",
                        MaterialCategoryName: "Wood",
                        MaterialCategoryType: "ZRMW"
                    },
                    {

                        MaterialCategoryCode: "41",
                        MaterialCategoryName: "Stone",
                        MaterialCategoryType: "ZRMS"
                    },
                    {

                        MaterialCategoryCode: "39",
                        MaterialCategoryName: "Metal",
                        MaterialCategoryType: "ZRMM"
                    }
                ]
            };

            return copPayload;

        } catch (error) {
            console.error("Error in mapCrfToCop:", error);
            throw req.reject(500, error.message || "Error while generating COP Payload");
        }
    }

    async function applyFormFlowRules_1(req) {
        if (!req || !req.data || typeof req.data !== 'object') {
            throw new Error('Invalid req or req.data');
        }

        const data = req.data;
        const rules = FormFlowRuleBook.rules;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const when = rule.when;

            let isMatch = true;

            for (const key in when) {
                if (!Object.prototype.hasOwnProperty.call(when, key)) {
                    continue;
                }

                // null in rule = condition ignored
                if (when[key] === null) {
                    continue;
                }

                // strict match required
                if (data[key] !== when[key]) {
                    isMatch = false;
                    console.log("FlowRule ", key, "=", when[key]);
                    console.log("UserData", key, "=", data[key]);
                    break;
                }
            }

            if (isMatch) {
                data.FlowName = rule.then.FlowName;
                data.FlowCode = rule.then.FlowCode;
                return;
            } else {
                req.reject(500, "Check Rule book")
            }
        }

        // No rule matched → explicitly clear
        data.FlowName = null;
        data.FlowCode = null;
        console.log(data.FlowName)
        console.log(data.FlowCode)
    }
    function applyFormFlowRules(req) {

        if (!req || !req.data || typeof req.data !== 'object') {
            throw new Error('Invalid req or req.data');
        }

        var data = req.data;
        var rules = FormFlowRuleBook.rules;

        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var when = rule.when;
            var isMatch = true;

            for (var key in when) {

                if (!Object.prototype.hasOwnProperty.call(when, key)) {
                    continue;
                }

                // null = ignore condition
                if (when[key] === null) {
                    continue;
                }

                if (data[key] !== when[key]) {
                    isMatch = false;
                    break;
                }
            }

            // ✅ Apply FIRST matching rule and exit
            if (isMatch) {
                data.FlowName = rule.then.FlowName;
                data.FlowCode = rule.then.FlowCode;
                return;
            }
        }

        // ❌ No rule matched → reject ONCE (correct place)
        req.reject(400, 'No matching flow rule found');
    }




    service.on('PDRM_Check_UserAvailability', async (req) => {
        try {
            for (const element of req.data.UserAssign) {
                if (element.CallMeeting === 'Y') {
                    const startDate = new Date(element.MeetingStartDate).toISOString();
                    const endDate = new Date(element.MeetingEndDate).toISOString();
                    // Fetch users with overlapping meetings
                    let existingUsers = await commonfun.getDataFromTable({
                        tableName: 'CCrfMeetingDetail',
                        conditions: [
                            ['UserID_UserGuid', '=', element.UserID_UserGuid], // Same user
                            ['Parent_CrfReqGuid', '!=', element.Parent_CrfReqGuid], // Exclude current request
                            ['MeetingStartDate', '<', endDate],  // Start < New End
                            ['MeetingEndDate', '>', startDate]   // End > New Start
                        ],
                        columns: ['UserID_UserGuid', 'MeetingStartDate', 'MeetingEndDate']
                    });

                    // If overlapping meetings found, user is not available
                    element.UserAvailable = existingUsers.length > 0 ? 'Not Available' : 'Available';
                } else if (element.CallMeeting === 'N') {
                    element.UserAvailable = 'NA';  // Not applicable
                }
            }

            return req.data.UserAssign;

        } catch (error) {
            console.error('Error Message: ', error.message);
            return { error: 'Something went wrong in checking user availability' };
        }
    });

    service.on('AlterNotificationClear', async (req) => {
        try {
            const db = await cds.connect.to('db');
            const { TNotification } = db.entities;
            const AlterNotificationData = req.data.NotificationData;
            let Status = '';
            if (AlterNotificationData) {

                for (const element of AlterNotificationData) {
                    if (element.Clear == true && element.Read == true) {

                        await db.update(TNotification).set({ Read: element.Read, Clear: element.Clear, }).where({ NotificationID: element.NotificationID });
                        Status = 'Notification cleared and marked successfully...';

                    } else if (element.Clear == false && element.Read == false || element.Clear == false && element.Read == true) {

                        await db.update(TNotification).set({ Read: element.Read, Clear: element.Clear, }).where({ NotificationID: element.NotificationID });
                        Status = "Notification marked as read...";

                    }
                }
                return AlterNotificationData;
            } else {
                throw req.error("Empty:Not able to get data   " + error.message);
            }
        } catch (error) {
            throw req.error("Empty: Unable to clear Notification Data... " + error.message);
        }
    })

    //==============================================================
    service.on('getUSPUsersForSelectionOnCrf', async (req) => {
        try {
            //19122024
            //action   getUSPUsersForSelectionOnCrf( BUYERCODE : String, PRODCATEGORYGUID : UUID,  CRFSTPRODCATEGORYCODE : String, MATERIALCATEGORYCODE : String)      returns array of String;
            let { BUYERCODE, PRODCATEGORYGUID, CRFSTPRODCATEGORYCODE, MATERIALCATEGORYCODE, STAGECODE, TEMPLATEGUID } = req.data;
            //let dbQuery = `Call "STONEMEN_USPGETCRFSEARCHDATA"('${guid}','${BUYERCODE}',${CRFREQNO},'${CRFSTATUS}','${CRFREQDATE}','${Techno}',RETURNDATA => ? )`
            let dbQuery = `Call "STONEMEN_USPGETUSERSFORSELECTIONONCRF"('${BUYERCODE}','${PRODCATEGORYGUID}','${CRFSTPRODCATEGORYCODE}','${MATERIALCATEGORYCODE}',RETURNDATA => ? )`

            let result = await cds.run(dbQuery, {})
            // const data = cds.log().info(result)
            // console.log(result.RETURNDATA);
            // return result.RETURNDATA;
            if (STAGECODE) {
                const InitialStageSeqId = 1
                let Stagedata = await commonfun.getDataFromTable({
                    tableName: "CTemplateStage",
                    conditions: [
                        ["StageSeqId", ">=", InitialStageSeqId],
                        ["StageSeqId", "<=", InitialStageSeqId + STAGECODE],
                        ["Parent_TemplateGuid", "=", TEMPLATEGUID],
                        ["DelMark", "=", 0]
                    ],
                    columns: ["Stage_StageGuid"]
                });
                let AllStageofthisform = Stagedata.map(Stage => Stage.Stage_StageGuid)

                let allRoleForAllStage = [];
                for (let i = 0; i < AllStageofthisform.length; i++) {
                    let roleOfThisStageGuid = await commonfun.getDataFromTable({
                        tableName: 'CStageRole',
                        conditions: [
                            ['Stage_StageGuid', '=', AllStageofthisform[i]],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                    });
                    if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                        allRoleForAllStage = allRoleForAllStage.concat(roleOfThisStageGuid); // Flatten the array
                    }
                }
                allRoleForAllStage = allRoleForAllStage.map(RoleCode => RoleCode.RoleCode)
                console.log(allRoleForAllStage)
                await Promise.all(result.RETURNDATA.map(async (item) => {
                    item.IsSelected = allRoleForAllStage.includes(item.USERROLECODE);
                }));
            }
            else {
                await Promise.all(result.RETURNDATA.map(async (item) => {
                    item.IsSelected = false
                }));
            }
            return result.RETURNDATA;
        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'getUSPUsersForSelectionOnCrf() - Oops, Something went wrong: ' + error.message };
        }
    });
    service.on('GetCrfSearchData', async (req) => {
        try {

            let { guid, BUYERNAME, CRFREQNO, CRFSTATUS, CRFREQDATE, REQTYPE, REFCRFREQNO, PDNO, PDNAME } = req.data;
            let dbQuery = `Call "STONEMEN_USPGETCRFSEARCHDATA"('${guid}','${BUYERNAME}',${CRFREQNO},'${CRFSTATUS}','${CRFREQDATE}','${REQTYPE}','${REFCRFREQNO}','${PDNO}','${PDNAME}',RETURNDATA => ? )`
            let GetCRFSearchData = await commonfun.CallProdecdure(dbQuery);
            return GetCRFSearchData.RETURNDATA;

        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'Oops, Something went wrong: ' + error.message };
        }
    });
    service.before("CREATE", 'MMenu', async (context) => {
        const cadService = await cds.connect.to('StonemanCADService');
        const { MenuCode, Description, ParentMenuCode } = context.data;
        let existingMenu = await SELECT.from(MMenu)
            .where({ MenuCode: MenuCode, ParentMenuCode: ParentMenuCode });
        // .and({ ParentMenuCode:ParentMenuCode });
        // Check if any records are found
        if (existingMenu.length > 0) {
            context.error(400, `MenuCode '${MenuCode}' already exists with ParentMenuCode '${ParentMenuCode}'.`);
        }
    });

    //MRole
    service.before("CREATE", 'MRole', async (context) => {
        const { RoleCode, Description } = context.data;

        // Check for existing entries with the same RoleCode or Description
        let existingRole = await SELECT.from(MRole)
            .where({ RoleCode: RoleCode })
            .or({ Description: Description });

        // If any record matches, throw an error
        if (existingRole.length > 0) {
            context.error(400, `Role with RoleCode '${RoleCode}' or Description '${Description}' already exists.`);
        }
    });
    //MProcess
    service.before("CREATE", "MProcess", async (context) => {
        const { Code, MaterialCategoryCode, MaterialCategoryName, Name } = context.data;

        // Extract CategoryCode from the first entry of Detail[] 
        const detail = context.data.Detail?.[0];
        if (!detail) {
            return context.error(400, "Detail array is required.");
        }

        const { CategoryCode, CategoryName } = detail;

        // Check if a record with same combination exists
        const existingProcess = await SELECT.one.from(MProcess).where({
            Code: Code,
            MaterialCategoryCode: MaterialCategoryCode,
            'Detail.CategoryCode': CategoryCode
        });

        if (existingProcess) {
            return context.error(
                400,
                `Process combination already exists: 
            Code = ${Code}, 
            Material Category = ${MaterialCategoryName}, 
            Category = ${CategoryName}.`
            );
        }
    });

    // //MStage
    service.before("CREATE", 'MStage', async (context) => {
        const { StageCode, Description } = context.data;

        // Check for existing entries with the same StageCode or Description
        let existingStage = await SELECT.from(MStage)
            .where({ StageCode })
            .or({ Description });

        // If any record matches, throw an error
        if (existingStage.length > 0) {
            context.error(400, `Stage with StageCode '${StageCode}' or Description '${Description}' already exists.`);
        }
    });

    // //Notify Template
    service.before("CREATE", 'MEmailTemplate', async (context) => {
        const { NotifyTemplateCode } = context.data;

        // let existingTemplate = await SELECT.from(MNotifyTemplate)
        // .where({ NotifyTemplateCode: NotifyTemplateCode });
        let existingTemplate = await commonfun.getDataFromTable({
            tableName: 'MNotifyTemplate',
            conditions: [
                ["NotifyTemplateCode", "=", NotifyTemplateCode]
            ]
        })
        console.log(NotifyTemplateCode);
        console.log(existingTemplate);
        // If any record matches, throw an error
        if (existingTemplate.length > 0) {
            context.error(400, `EMail Template with Code '${NotifyTemplateCode}' already exists.`);
        }
    });
    // For MProductSubCat
    service.before("CREATE", 'MProductSubCat', async (context) => {
        const { TypeCode, CountryCode, Name } = context.data;
        let getExisttingdata = await commonfun.getDataFromTable({
            tableName: "MProductSubCat",
            conditions: [
                ["TypeCode", "=", TypeCode],
                ["CountryCode", "=", CountryCode],
                ["Name", "=", Name]
            ]
        });
        if (getExisttingdata.length > 0) {
            context.error(400, `Record  with Code '${TypeCode}', '${CountryCode}'  and '${Name}'already exists.`);
        }
    });
    // Menu Access Role
    service.before("CREATE", 'MMenuRoleAccess', async (context) => {
        const { Role_RoleGuid } = context.data;

        let existingRoleAccess = await SELECT.from(MMenuRoleAccess)
            .where({ Role_RoleGuid: Role_RoleGuid });
        // If any record matches, throw an error
        if (existingRoleAccess.length > 0) {
            context.error(400, `Notify Template with Code '${Role_RoleGuid}' already exists.`);
        }
    });

    service.before("CREATE", MProductCategory, async (context) => {
        let { ProductCategoryCode, ProductCategoryName, FirstNum, IncrementBy, LastNum } = context.data;
        let existCode = await SELECT.from(MProductCategory).where({ ProductCategoryCode: ProductCategoryCode });
        if (existCode.length > 0) {
            return context.error(400, `Product Category Code already exist. Please change`);
        }
        let existName = await SELECT.from(MProductCategory).where({ ProductCategoryName: ProductCategoryName });
        if (existName.length > 0) {
            return context.error(400, `Product Categoey Name already exist. Please change`);

        }


    });
    service.on('GetTemplate', async (req) => {
        try {
            let { MenuSubType, MenuCode } = req.data;
            let dbQuery = `Call "STONEMEN_USPGETDTEMPLATE"('${MenuSubType}','${MenuCode}',RETURNDATA => ? )`
            let GetTemplateData = await commonfun.CallProdecdure(dbQuery);
            return GetTemplateData.RETURNDATA;

        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'Oops, Something went wrong: ' + error.message };
        }
    });

    service.on('DocumentFieldsEnableDisable', async (req) => {
        try {

            let { DOCUMENTGUID, LOGINGUID, ROLEGUID, STAGEGUID } = req.data;
            let dbQuery = `Call "STONEMEN_USPGETENABLEANDDISABLECONTROLS"('${DOCUMENTGUID}','${LOGINGUID}','${ROLEGUID}','${STAGEGUID}',EnableTable => ?)`;
            let GetControlId = await commonfun.CallProdecdure(dbQuery);
            return GetControlId.ENABLETABLE;

        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'Oops, Something went wrong: ' + error.message };
        }
    });


    service.on('ProductGetCadLevel', async (req) => {
        try {
            console.log("service")

            let { ProductCategoryGuid, CADLevelCode, CRFDATE } = req.data;
            let noofdays = await commonfun.getDataFromTable({
                tableName: "CProductCategoryCADLevel",
                conditions: [
                    ["Parent_ProductCategoryGuid", "=", ProductCategoryGuid],
                    ["CADLevelCode", "=", CADLevelCode],
                    ["DelMark", '=', 0]
                ],
                columns: ["IncrementBy"]
            });
            console.log(CRFDATE)
            console.log("noofdays", noofdays)
            if (noofdays.length > 0) {
                CRFDATE = new Date(CRFDATE);
                CRFDATE.setDate(CRFDATE.getDate() + noofdays[0].IncrementBy)
                console.log(CRFDATE)
                CRFDATE = CRFDATE.toISOString().split('T')[0]
            }
            console.log(CRFDATE)
            let data = {
                "CADDeliveryDate": CRFDATE
            }
            return data;

        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'Oops, Something went wrong: ' + error.message };
        }
    });
    // service.on('getSubProductField', async (req) => {
    //     try {
    //         // console.log("service")

    //         // let { ProductCategoryGuid, CADLevelCode, CRFDATE } = req.data;
    //         let result = await commonfun.getDataFromTable({
    //             tableName: "MEnum",
    //             conditions: [
    //                 ["EnumType", "=", req.data.ProductCatCode]
    //             ],
    //             columns: ["EnumCode as Value","EnumDescription as Lable"]
    //         });
    //         console.log(result)
    //         await Promise.all(result.map(async (item) => {
    //             const num = await commonfun.getDataFromTable({
    //                 tableName: "MProductSubCat",
    //                 conditions: [
    //                     ["EnumType", "=", req.data.ProductCatCode],
    //                     ["TypeCode", "=", item.Value],
    //                     ["CountryCode", "!=", null]
    //                 ]
    //             });

    //             console.log("enter");

    //             item.Country = num.length > 0;
    //         }));
    //         return result;

    //     } catch (error) {
    //         console.error('Error:', error.message);
    //         return { error: 'Oops, Something went wrong: ' + error.message };
    //     }
    // });
    service.on('getSubProductField', async (req) => {
        try {
            console.log("Service triggered for getSubProductField");

            // Fetch initial data
            let result = await commonfun.getDataFromTable({
                tableName: "MEnum",
                conditions: [
                    ["EnumType", "=", req.data.ProductCatCode]
                ],
                columns: ["EnumCode as Value", "EnumDescription as Lable"]
            });

            if (!result || result.length === 0) {
                console.warn("No records found in MEnum for ProductCatCode:", req.data.ProductCatCode);
                return [];
            }

            console.log("Fetched result:", result);

            // Process each item in parallel
            await Promise.all(result.map(async (item) => {
                try {
                    const num = await commonfun.getDataFromTable({
                        tableName: "MProductSubCat",
                        conditions: [
                            ["EnumType", "=", req.data.ProductCatCode],
                            ["TypeCode", "=", item.Value],
                            ["CountryCode", "!=", null]
                        ]
                    });

                    console.log("Processing:", item.Value, "Found:", num.length, "entries");
                    item.Country = num.length > 0;
                } catch (err) {
                    console.error("Error fetching MProductSubCat data for:", item.Value, err);
                    item.Country = false; // Fallback value in case of error
                }
            }));

            console.log("Final result:", result);
            return result;

        } catch (error) {
            console.error('Error in getSubProductField:', error.message);
            return { error: 'Oops, something went wrong: ' + error.message };
        }
    });



    service.before("CREATE", 'MBuyerProductCat', async (context) => {
        const { BuyerName, ProductCategoryName } = context.data;
        let getExisttingdata = await commonfun.getDataFromTable({
            tableName: "MBuyerProductCat",
            conditions: [
                ["BuyerName", "=", BuyerName],
                ["ProductCategoryName", "=", ProductCategoryName]

            ]
        });
        if (getExisttingdata.length > 0) {
            context.error(400, `Record  with Name '${BuyerName}', and '${ProductCategoryName}'already exists.`);
        }
    });
});