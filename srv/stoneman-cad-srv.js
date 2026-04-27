const cds = require('@sap/cds');
const commonfun = require('./stoneman-common-srv');
const { constants } = require('@sap/xssec');
const SequenceHelper = require("./lib/SequenceGenerator");
const approvalfun = require('./stoneman-approval-srv');
const { context } = require('@sap/cds');
var reqStageGuid;  //notify

module.exports = cds.service.impl(async (service) => {
    const db = await cds.connect.to("db");
    const { TCadDetail, CCADTeam, TCadSeekAdvice, TNotification } = service.entities;
    var { MUser, CCADSeekAdvice, CUserMaterialCategory, CTemplateMenu, MProcess, CDataFlow, DData } = db.entities('Stonemen');

    let NotificationArray = {};

    service.on('MyCADDetailDocuments', async (req) => {
        try {
            const result = await commonfun.getDataFromTable({
                tableName: 'TCadDetail',
                columns: ["CadDetailNo as CADDETAILNO", "CrfReqNo as CRFREQNO", "CadDetailUUID as CadDetailUUID", "ReqTyp as REQTYP", "InputType as INPUTTYPE", "BuyerName as BUYERNAME", "CreatedByUserID.UserName as USERNAME", "CadStatus as CadStatus"]
            })
            return result;
        } catch (error) {
            console.error('Error:', error.message);
            return { error: 'Oops, Something went wrong: ' + error.message };
        }
    });

    service.on('getCadDetailData', async (req) => {
        const {
            BUYERCODE,
            CrfReqNo,
            ProductCategoryName,
            CADDETAILNO,
            MatGroupName,
            CadStatus,
            CrfDelDate,
            CrfCategory,
            loginUserId,
            PendingWithMe
        } = req.data;

        let BuyerCode = BUYERCODE;
        let ProductCatName = ProductCategoryName;
        let CadDetailNo = CADDETAILNO;
        let MCatName = MatGroupName


        const AdminData = await SELECT.from(MUser).where({ UserGuid: loginUserId });


        const dynamicFilter = {
            ...(BuyerCode && { BuyerCode }),
            ...(CrfReqNo && { CrfReqNo }),
            ...(ProductCatName && { ProductCatName }),
            ...(CadDetailNo && { CadDetailNo }),
            ...(MCatName && { MCatName: { like: `%${MCatName}%` } }),
            ...(CadStatus && { CadStatus }),
            ...(CrfDelDate && { CrfDelDate }),
            ...(CrfCategory && { CrfCategory })
        };

        let result = [];

        if (PendingWithMe === true) {
            let pendingForm = await SELECT.from(CDataFlow)
                .columns('Parent.ObjectGuid').
                where({
                    User_UserGuid: loginUserId,
                    RowStatus: 'OPEN'
                })

            pendingForm = pendingForm.map(row => row.Parent_ObjectGuid);
            console.log("pendingForm-->>>>", pendingForm)

            result = await SELECT
                .from(TCadDetail).columns(
                    { ref: ['BuyerName'], as: 'BUYERNAME' },
                    { ref: ['CadDetailNo'], as: 'CADDETAILNO' },
                    { ref: ['CrfReqNo'], as: 'CRFREQNO' },
                    { ref: ['CadDetailUUID'], as: 'CadDetailUUID' },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['CadStatus'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'WIP' }, 'then', { val: 'Work-in-Progress' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'CLS' }, 'then', { val: 'Closed' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'C' }, 'then', { val: 'Cancelled' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'AutoDraft' }, 'then', { val: 'AutoDraft' },
                            'else', { ref: ['CadStatus'] },
                            'end'
                        ],
                        as: 'CadStatus'
                    },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['InputType'] }, '=', { val: 'I' }, 'then', { val: 'Internal' },
                            'when', { ref: ['InputType'] }, '=', { val: 'E' }, 'then', { val: 'External' },
                            'else', { ref: ['InputType'] },
                            'end'
                        ],
                        as: 'INPUTTYPE'
                    },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['ReqTyp'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                            'when', { ref: ['ReqTyp'] }, '=', { val: 'R' }, 'then', { val: 'Repeat' },
                            'else', { ref: ['ReqTyp'] },
                            'end'
                        ],
                        as: 'REQTYP'
                    },
                    { ref: ['CreatedByUserID', 'UserName'], as: 'USERNAME' }
                )
                .where({ CadDetailUUID: { in: pendingForm }, ...dynamicFilter }).orderBy('CadDetailNo desc');
        } else {

            if (AdminData[0]?.UserRoleCode === "ADMIN" || AdminData[0]?.UserRoleCode === "DTP_HEAD") {
                result = await SELECT.from(TCadDetail).columns(
                    { ref: ['BuyerName'], as: 'BUYERNAME' },
                    { ref: ['CadDetailNo'], as: 'CADDETAILNO' },
                    { ref: ['CrfReqNo'], as: 'CRFREQNO' },
                    { ref: ['CadDetailUUID'], as: 'CadDetailUUID' },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['CadStatus'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'WIP' }, 'then', { val: 'Work-in-Progress' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'CLS' }, 'then', { val: 'Closed' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'C' }, 'then', { val: 'Cancelled' },
                            'when', { ref: ['CadStatus'] }, '=', { val: 'AutoDraft' }, 'then', { val: 'AutoDraft' },
                            'else', { ref: ['CadStatus'] },
                            'end'
                        ],
                        as: 'CadStatus'
                    },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['InputType'] }, '=', { val: 'I' }, 'then', { val: 'Internal' },
                            'when', { ref: ['InputType'] }, '=', { val: 'E' }, 'then', { val: 'External' },
                            'else', { ref: ['InputType'] },
                            'end'
                        ],
                        as: 'INPUTTYPE'
                    },
                    {
                        xpr: [
                            'case',
                            'when', { ref: ['ReqTyp'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                            'when', { ref: ['ReqTyp'] }, '=', { val: 'R' }, 'then', { val: 'Repeat' },
                            'else', { ref: ['ReqTyp'] },
                            'end'
                        ],
                        as: 'REQTYP'
                    },
                    { ref: ['CreatedByUserID', 'UserName'], as: 'USERNAME' }
                )

                    .where(dynamicFilter)
                    .orderBy('CadDetailNo desc');
            } else {

                const teamRecords = await SELECT.from(CCADTeam)
                    .columns('Parent_CadDetailUUID')
                    .where({ User_UserGuid: loginUserId });

                const teamIDs = teamRecords.map(t => t.Parent_CadDetailUUID);

                const seekAdviceRecords = await SELECT.from(CCADSeekAdvice)
                    .columns('Parent_CadDetailUUID')
                    .where({ QuestionToUser_UserGuid: loginUserId, DelMark: 0 });

                const seekAdviceIDs = seekAdviceRecords.map(s => s.Parent_CadDetailUUID);


                const allIDs = [...new Set([...teamIDs, ...seekAdviceIDs])];


                if (allIDs.length > 0) {
                    result = await SELECT.from(TCadDetail).columns(
                        { ref: ['BuyerName'], as: 'BUYERNAME' },
                        { ref: ['CadDetailNo'], as: 'CADDETAILNO' },
                        { ref: ['CrfReqNo'], as: 'CRFREQNO' },
                        { ref: ['CadDetailUUID'], as: 'CadDetailUUID' },
                        {
                            xpr: [
                                'case',
                                'when', { ref: ['CadStatus'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                                'when', { ref: ['CadStatus'] }, '=', { val: 'WIP' }, 'then', { val: 'Work-in-Progress' },
                                'when', { ref: ['CadStatus'] }, '=', { val: 'CLS' }, 'then', { val: 'Closed' },
                                'when', { ref: ['CadStatus'] }, '=', { val: 'C' }, 'then', { val: 'Cancelled' },
                                'when', { ref: ['CadStatus'] }, '=', { val: 'AutoDraft' }, 'then', { val: 'AutoDraft' },
                                'else', { ref: ['CadStatus'] },
                                'end'
                            ],
                            as: 'CadStatus'
                        },
                        {
                            xpr: [
                                'case',
                                'when', { ref: ['InputType'] }, '=', { val: 'I' }, 'then', { val: 'Internal' },
                                'when', { ref: ['InputType'] }, '=', { val: 'E' }, 'then', { val: 'External' },
                                'else', { ref: ['InputType'] },
                                'end'
                            ],
                            as: 'INPUTTYPE'
                        },
                        {
                            xpr: [
                                'case',
                                'when', { ref: ['ReqTyp'] }, '=', { val: 'N' }, 'then', { val: 'New' },
                                'when', { ref: ['ReqTyp'] }, '=', { val: 'R' }, 'then', { val: 'Repeat' },
                                'else', { ref: ['ReqTyp'] },
                                'end'
                            ],
                            as: 'REQTYP'
                        },
                        { ref: ['CreatedByUserID', 'UserName'], as: 'USERNAME' }
                    )
                        .where({
                            ...dynamicFilter,
                            CadDetailUUID: { in: allIDs }
                        })
                        .orderBy('CadDetailNo desc');
                }
            }
        }

        return result;
    });


    service.before(['CREATE', 'UPDATE'], TCadDetail, async (req) => {
        NotificationArray.prevStageGuid = req.data?.CadStageCode_StageGuid;
        NotificationArray.prevStage = req.data?.CadStageName;
        NotificationArray.isAutoApproved = false


        if (req.event == 'CREATE') {
            const NewCadNumber = new SequenceHelper({
                db: db,
                sequence: "SEQ_CAD_ID",
                table: "TCadDetail",
                field: "CadDetailNo"
            });
            req.data.CadDetailNo = await NewCadNumber.getNextNumber();
        }
        if (req.data.CadStatus === "AutoDraft" && req.data.SaveOrSubmit === "Draft") {
            console.log("Skipping before handler because status is AutoDraft");
            return;

        }
        if (req.data.SaveOrSubmit != "SeekAdvice") {

            const curLoginUserGuid = req.data.loginUserID_UserGuid;
            let curStageGuid = req.data.CadStageCode_StageGuid;
            const curTemplateGuid = req.data.Template_TemplateGuid;
            let curStageIsFirstStage = "N";
            let curStageIsApproval = "N";
            let curStageNoofApprovalsReq = 0;
            let curStageNoofRejectionsReq = 0;
            let curStageCode = "";
            let curDataRowNumber = 0;
            reqStageGuid = req.data.CadStageCode_StageGuid;
            req.data.Stage_StageGuid = curStageGuid;

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
                    req.data.CadStageCode_StageGuid = curStageGuid;
                    NotificationArray.prevStageGuid = req.data?.CadStageCode_StageGuid
                    req.data.Stage_StageGuid = curStageGuid; // need to remove after validation
                };

                let curStageDetails = await commonfun.getDataFromTable({
                    tableName: 'MStage',
                    conditions: [
                        ['StageGuid', '=', req.data.CadStageCode_StageGuid]
                    ],
                    columns: ["StageCode"]
                });

                if (curStageDetails.length > 0) {
                    curStageCode = curStageDetails[0].StageCode;
                    req.data.CadStageName = curStageCode;
                    NotificationArray.prevStage = curStageCode;
                    req.data.CrfStageCode = curStageCode; // need to delete before saving data
                }
                else {
                    throw req.reject("Stage " + req.data.CadStageCode_StageGuid + " is not defined!!!");
                }


            }
            else if (curStageGuid != undefined) {
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
                    req.data.CadStageName = curStageCode;
                }

                if (req.data.ApprovalTransaction.length == 1) {
                    curStageIsFirstStage = 'Y';
                }
            }
            // else {
            //     throw req.reject("Current Stage Guid  is not defined!!!");
            // }

            if (req.event == "CREATE" && curStageIsFirstStage == "Y") {

                if (req.data.SaveOrSubmit == "SAVE") {

                    req.data = await approvalfun.createFirstStageApprovalTransactionPayload(req, curStageIsFirstStage);
                    // req.data.CrfStatus = "WIP";
                    req.data.CrfReqDate = new Date().toISOString() // update the Today Date - Rishiraj
                }

                else if (req.data.SaveOrSubmit == "SUBMIT") {

                    const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req);
                    console.log(isLoginUserValid);
                    //if no - do nothing
                    if (isLoginUserValid == false) {
                        throw req.reject("Login user is not valid. Please check isLoginUserValidForCurrentStage()!!!");
                    };

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
                        let roleOfThisStageGuid = await commonfun.getDataFromTable({
                            tableName: 'CStageRole',
                            conditions: [
                                ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                ['DelMark', '=', '0']
                            ],
                            columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                        });

                        if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                            AllRoleForAllStage = AllRoleForAllStage.concat(roleOfThisStageGuid); // Flatten the array
                        }
                    }
                    let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, AllRoleForAllStage, req, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        //throw new Error("Issue in createApprovalTransactionPayload(). Please check!!!");
                        throw req.reject("Issue in createApprovalTransactionPayload(). Please check!!!");
                    }
                    else {
                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }
                    curDataRowNumber = 1;
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }

                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }


                    nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                    if (nextStageData.length > 0) {
                        req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageName = nextStageData[0].StageCode;
                        req.data.CrfStageCode = nextStageData[0].StageCode; // need to  deleted before saving
                    }
                    curDataRowNumber = curDataRowNumber + 1
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }
                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }

                    req.data.CadStatus = "WIP";

                }

            }

            else if (req.event == "UPDATE" && curStageIsFirstStage == "Y") {

                if (req.data.SaveOrSubmit == "SAVE") {
                    req.data.CrfReqDate = new Date().toISOString()
                    //length = 1
                    //update - save - firststage    //do nothing
                    // if (req.data.ApprovalTransaction.length = 1) {
                    //     return;
                    // }
                }

                else if (req.data.SaveOrSubmit == "SUBMIT") {
                    const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req);
                    console.log(isLoginUserValid);
                    //if no - do nothing
                    if (isLoginUserValid == false) {
                        throw req.reject("Login user is not valid. Please check isLoginUserValidForCurrentStage()!!!");
                    };

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
                        let roleOfThisStageGuid = await commonfun.getDataFromTable({
                            tableName: 'CStageRole',
                            conditions: [
                                ['Stage_StageGuid', '=', AllStageofthisform2[i].Stage_StageGuid],
                                ['DelMark', '=', '0']
                            ],
                            columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
                        });

                        if (roleOfThisStageGuid && Array.isArray(roleOfThisStageGuid) && roleOfThisStageGuid.length > 0) {
                            AllRoleForAllStage = AllRoleForAllStage.concat(roleOfThisStageGuid); // Flatten the array
                        }
                    }

                    let updatedAllRoleForAllStage = [...(AllRoleForAllStage || [])];
                    let Tempteam = req.data?.Team || [];
                    const hasDTP_ASSISTANT = Tempteam.some(
                        t => t.RoleCode?.toUpperCase() === "DTP_ASSISTANT"
                    );
                    if (hasDTP_ASSISTANT) {
                        // remove DTP_HEAD for the CAD_FORMFILL stage (case-insensitive)
                        updatedAllRoleForAllStage = updatedAllRoleForAllStage.filter(
                            r => !(r.StageCode === "CAD_FORMFILL" && r.RoleCode?.toUpperCase() === "DTP_HEAD")
                        );
                    }

                    let generatedPayload = await approvalfun.createApprovalTransactionPayload(curStageIsFirstStage, updatedAllRoleForAllStage, req, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        //throw new Error("Issue in createApprovalTransactionPayload(). Please check!!!");
                        throw req.reject("Issue in createApprovalTransactionPayload(). Please check!!!");
                    }
                    else {
                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }
                    curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                    console.log(curDataRowNumber);
                    // curDataRowNumber = 1;
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }

                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }


                    nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                    if (nextStageData.length > 0) {
                        req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageName = nextStageData[0].StageCode;
                    }
                    curDataRowNumber = curDataRowNumber + 1
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }
                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }

                    req.data.CadStatus = "WIP";

                    // }
                }
            }
            else if (req.event == "UPDATE" && req.data.SaveOrSubmit == "SUBMIT") {

                const isLoginUserValid = await commonfun.isLoginUserValidForCurrentStage(req);


                if (isLoginUserValid == false) {
                    throw req.reject("Login user is not valid. Please check isLoginUserValidForCurrentStage()!!!");
                };
                // Team Validation Start 
                // await commonfun.validateUsersInTeamForEachStage(req);
                // try {
                //     await commonfun.processMissingUsers(req)
                // } catch (error) {
                //     console.error('Error during processMissingUsers():', error);
                //     throw req.reject(400, "Error in processMissingUsers(): Unable to add user in data flow" + error)
                // }



                const CurrentStageSeqId = await commonfun.getDataFromTable({
                    tableName: 'CTemplateStage',
                    conditions: [
                        ['Parent_TemplateGuid', '=', req.data.Template_TemplateGuid],
                        ['Stage_StageGuid', '=', req.data.Stage_StageGuid],
                        ['DelMark', '=', '0']
                    ],
                    columns: ["StageSeqId", "Stage.IsApproval"]
                });
                console.log("CurrentStageSeqId", CurrentStageSeqId)
                if (CurrentStageSeqId[0].Stage_IsApproval === 'Y') {
                    console.log("CurrentStageSeqId[0].Stage_IsApproval", CurrentStageSeqId[0].Stage_IsApproval)
                    curStageIsApproval = "Y";
                    if (req.data.newApprovalStatus === "APPROVED") {
                        curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                        generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, req.data.newApprovalStatus, null);
                        // generatedPayload = await approvalfun.updateStageAndFlow(2, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, req.data.newApprovalStatus, null);
                        if (generatedPayload == null || generatedPayload == undefined) {
                            throw new Error("Please check updateStageAndFlow()!!!");
                        }

                        else {

                            x = JSON.stringify(generatedPayload);
                            req.data.ApprovalTransaction = JSON.parse(x);
                        }

                        nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                        if (nextStageData.length > 0) {
                            req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                            req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                            req.data.CadStageName = nextStageData[0].StageCode;
                        }
                        else {
                            req.data.CadStatus = "CLS"
                            req.data.ApprStatus = req.data.newApprovalStatus;
                        }


                    }

                    else if (req.data.newApprovalStatus === "REJECTED") {

                        curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                        generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, req.data.newApprovalStatus, 'INSERTNEW');
                        if (generatedPayload == null || generatedPayload == undefined) {
                            throw new Error("Please check updateStageAndFlow()!!!");
                        }

                        else {

                            x = JSON.stringify(generatedPayload);
                            req.data.ApprovalTransaction = JSON.parse(x);
                        }
                        // curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                        const nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid, -1);
                        if (nextStageData.length > 0) {
                            //designupload(close) -rownumber = 3, techno(close)- rownumber=4, techno(NA)--INSERTED & ronumber=6,design(0pen)--INSERTED & rownumber=5

                            //curDataRowNumber = 4+1=5
                            curDataRowNumber = curDataRowNumber + 1;
                            req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                            req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                            req.data.CrfStageCode = nextStageData[0].StageCode;
                            req.data.CadStageName = nextStageData[0].StageCode;

                            //insert new records for prev stage in Open state in data & flow
                            //#region  curDataRowNumber =5
                            generatedPayload = await approvalfun.getStageAndFlow(curDataRowNumber, req);
                            // generatedPayload = await approvalfun.getStageAndFlow(curDataRowNumber, req);
                            if (generatedPayload != null) {
                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction.push(JSON.parse(x));
                            }
                            else {
                                throw req.reject('\nError in function getStageAndFlow!!!');
                            }
                            //#endregion
                        }
                    }
                }
                else if (CurrentStageSeqId[0].Stage_IsApproval === 'N') {
                    curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                    // curDataRowNumber = 3;
                    // return;
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }

                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }


                    nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                    if (nextStageData.length > 0) {
                        req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                        req.data.CadStageName = nextStageData[0].StageCode;
                    }
                    curDataRowNumber = curDataRowNumber + 1
                    generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'OPEN', req.data.loginUserID_UserGuid, null, null);
                    if (generatedPayload == null || generatedPayload == undefined) {
                        throw new Error("Please check updateStageAndFlow()!!!");
                    }
                    else {

                        x = JSON.stringify(generatedPayload);
                        req.data.ApprovalTransaction = JSON.parse(x);
                    }

                    const CurrentStageSeqIdForDTP_Head = await commonfun.getDataFromTable({
                        tableName: 'CTemplateStage',
                        conditions: [
                            ['Parent_TemplateGuid', '=', req.data.Template_TemplateGuid],
                            ['Stage_StageGuid', '=', req.data.Stage_StageGuid],
                            ['DelMark', '=', '0']
                        ],
                        columns: ["StageSeqId", "Stage.IsApproval"]
                    });

                    if (req.data.SaveOrSubmit == "SUBMIT" && CurrentStageSeqIdForDTP_Head[0].Stage_IsApproval === 'Y' && req.data.loginUserID_UserGuid == req.data.CreatedByUserID_UserGuid) {
                        console.log("Submit by DTP Head")
                        console.log("CurrentStageSeqId[0].Stage_IsApproval", CurrentStageSeqIdForDTP_Head[0].Stage_IsApproval)
                        curStageIsApproval = "Y";
                        req.data.newApprovalStatus = "APPROVED"
                        req.data.newApprovalComment = "Auto Approved By System"
                        NotificationArray.isAutoApproved = true
                        if (req.data.newApprovalStatus === "APPROVED") {
                            curDataRowNumber = await approvalfun.getCurrentStageRowNumber(req.data);
                            generatedPayload = await approvalfun.updateStageAndFlow(curDataRowNumber, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, req.data.newApprovalStatus, null);
                            // generatedPayload = await approvalfun.updateStageAndFlow(2, req, req.data.Stage_StageGuid, 'CLOSE', req.data.loginUserID_UserGuid, req.data.newApprovalStatus, null);
                            if (generatedPayload == null || generatedPayload == undefined) {
                                throw new Error("Please check updateStageAndFlow()!!!");
                            }

                            else {

                                x = JSON.stringify(generatedPayload);
                                req.data.ApprovalTransaction = JSON.parse(x);
                            }

                            nextStageData = await commonfun.getNextStageGuid(req, req.data.Template_TemplateGuid, req.data.Stage_StageGuid);
                            if (nextStageData.length > 0) {
                                req.data.Stage_StageGuid = nextStageData[0].StageGuid;
                                req.data.CadStageCode_StageGuid = nextStageData[0].StageGuid;
                                req.data.CadStageName = nextStageData[0].StageCode;
                            }
                            else {
                                req.data.CadStatus = "CLS"
                                req.data.ApprStatus = req.data.newApprovalStatus;
                            }
                        }
                        // Not Aplicable auto reject

                    }
                }
            }
        }
        delete req.data.Stage_StageGuid;
        delete req.data.CrfStageCode;
    });

    service.after(['CREATE', 'UPDATE'], TCadDetail, async (Data, req) => {
        let d = await SendNotification(Data);
    })

    service.after('UPDATE', TCadDetail, async (Data, req) => {

        if (Data.CadStatus == "CLS") {

            async function mapCadDetailToCostingPayload(source, categoryResult) {
                // const categories = (source.MCatName || "").split("+");
                const validTypes = ["ZRMA", "ZRMS", "ZRMM", "ZRMW", "ZRMP"];
                const categories = new Set();
                 categories.add("ZRMP");
                (source.MainAssembly || []).forEach(main => {
                    (main.ChildAssembly || []).forEach(child => {
                        if (child.Type && validTypes.includes(child.Type)) {
                            categories.add(child.Type.trim()); // add unique values
                        }
                    });
                });

                const categoryArray = Array.from(categories);
                //  Menu details validation
                let curMenuDetails = await commonfun.getDataFromTable({
                    tableName: 'MMenu',
                    conditions: [
                        ['MenuCode', '=', 'COST'],
                        ['DelMark', '=', '0']
                    ],
                    columns: ["MenuGuid"]
                });

                if (!curMenuDetails || curMenuDetails.length === 0) {
                    throw req.reject(404, "COST form Menu with Code (COST) is not defined!");
                }
                source.MMenu_MenuGuid = curMenuDetails[0].MenuGuid;

                const menuData = await commonfun.getDataFromTable({
                    tableName: 'CTemplateMenu',
                    conditions: [
                        ['MenuCode', '=', 'COST'],
                        ['MenuSubType', '=', 'CAD']
                    ],
                    columns: ['Parent_TemplateGuid']
                });


                menuData[0].Parent_TemplateGuid;

                const target = {
                    CostingHeaderUUID: null,
                    CADNo: source.CadDetailNo ?? null,
                    CADUUID_CadDetailUUID: source.CadDetailUUID ?? null,
                    CrfReqUUID_CrfReqGuid: source.CrfReqUUID_CrfReqGuid ?? null,
                    CrfReqNo: source.CrfReqNo ?? null,
                    // CrfCategory: source.CrfCategory ?? null,
                    CADLevel: source.CADLevel ? source.CADLevel.toUpperCase() : null,
                    SubCatName: source.SubCatName ?? null,
                    MCatCode: source.MCatCode ?? null,
                    MCatName: source.MCatName ?? null,
                    MerReqDate: source.MerReqDate ?? null,
                    BrandName: source.BrandName ?? null,
                    CategoryCode: source.CategoryCode ?? null,
                    CostingType: source.CostingType ?? null,
                    CategoryUniqueNum: source.CategoryUniqueNum ?? null,
                    OldCadDetailNo: source.OldCadDetailNo ?? null,
                    OldCrfReqNo: source.OldCrfReqNo ?? null,
                    EstCostInDocCur: source.EstCostInDocCur ?? null,
                    EstCostInINR: source.EstCostInINR ?? null,
                    BuyerCur: source.BuyerCur ?? null,
                    ExchRate: source.ExchRate ?? null,
                    CrfDelDate: source.CrfDelDate ?? null,
                    Reamrks: source.Reamrks ?? null,
                    CarNo: source.CarNo ?? null,
                    ECNNo: source.ECNNo ?? null,
                    FormStatus: "AutoDraft",
                    ItemCode: source.ItemCode ?? null,
                    ItemDesc: source.ItemDesc ?? null,
                    isPattern: source.isPattern ?? null,
                    PackagingType: source.PackagingType ?? null,
                    AssembledLocation: source.AssembledLocation ?? null,
                    SciplCode: null,
                    SciplDesc: null,
                    CostingTypeCode: null,
                    CostingTypeName: null,
                    ProductCategory: source.ProductCatName ?? null,
                    Diameter: source.Diameter ?? null,
                    Length: source.Length ?? null,
                    Width: source.Width ?? null,
                    Height: source.Height ?? null,
                    UnitCode: source.UnitCode ?? null,
                    UnitName: source.UnitName ?? null,
                    Weight: null,
                    CostingDate: null,
                    BuyerCode: source.BuyerCode ?? null,
                    BuyerName: source.BuyerName ?? null,
                    ApprStatus: null,
                    SaveOrSubmit: "Draft",
                    newApprovalStatus: null,
                    newApprovalComment: null,
                    CreatedByUserID_UserGuid: null,
                    CostingStageCode_StageGuid: null,
                    CostingStageName: null,
                    loginUserID_UserGuid: null,
                    TotalApproved: 0,
                    TotalRejected: 0,
                    InputType: source.InputType ?? null,
                    ReqTyp: source.ReqTyp,
                    CostingVersion: null,
                    PDNo: source.PDNo ?? null,
                    PDDate: source.PDDate ?? null,
                    MMenu_MenuGuid: source.MMenu_MenuGuid ?? null,
                    Template_TemplateGuid: menuData[0].Parent_TemplateGuid,
                    InspDraw: (source.InspDraw || []).map(draw => ({
                        ApprovalStatus: draw.ApprovalStatus ?? null,
                        AttachmentRemarks: draw.AttachmentRemarks ?? null,
                        // CostingAttachmentsGuid: draw.CADAttachmentsGuid ?? null,
                        // Parent: draw.ParentRef ?? null,
                        Remarks: draw.Remarks ?? null,
                        RowNumber: draw.RowNumber ?? null,
                        RowStatus: draw.RowStatus ?? null,
                        StageCode: draw.StageCode ?? null,
                        Stage_StageGuid: draw.Stage_StageGuid ?? null,
                        User_UserGuid: draw.User_UserGuid ?? null,
                        Attachment: (draw.Attachment || []).map(att => ({
                            // AttachmentGuId: att.AttachmentGuId ?? null,
                            AttachmentName: att.AttachmentName ?? null,
                            OrgFileName: att.OrgFileName ?? null,
                            OrgFileExtension: att.OrgFileExtension ?? null,
                            SysFileName: att.SysFileName ?? null,
                            SysFileExtension: att.SysFileExtension ?? null,
                            ReferenceType: att.ReferenceType ?? null,
                            ReferenceId: att.ReferenceId ?? null,
                            SysFilePath: att.SysFilePath ?? null,
                            UploadedOnCloud: att.UploadedOnCloud ?? null,
                            DelMark: att.DelMark ?? null,
                            Remarks: att.Remarks ?? null,
                            dmsFileId: att.dmsFileId ?? null,
                            dmsFileName: att.dmsFileName ?? null,
                            dmsFileExtension: att.dmsFileExtension ?? null,
                            dmsFolderPath: att.dmsFolderPath ?? null,
                            dmsRepoId: att.dmsRepoId ?? null,

                        }))
                    })),
                    MainAttachment: source.MainAttachment
                    ? {
                        
                        StageCode: source.MainAttachment.StageCode,
                        Stage_StageGuid: source.MainAttachment.Stage_StageGuid,
                        User_UserGuid: source.MainAttachment.User_UserGuid,

                        // Nested Attachment mapped exactly
                        Attachment: source.MainAttachment.Attachment
                            ? {
                               
                                AttachmentName: source.MainAttachment.Attachment.AttachmentName,
                                OrgFileExtension: source.MainAttachment.Attachment.OrgFileExtension,
                                OrgFileName: source.MainAttachment.Attachment.OrgFileName,
                                ReferenceGuid: source.MainAttachment.Attachment.ReferenceGuid,
                                ReferenceId: source.MainAttachment.Attachment.ReferenceId,
                                ReferenceType: source.MainAttachment.Attachment.ReferenceType,
                                Remarks: source.MainAttachment.Attachment.Remarks,
                                SysFileExtension: source.MainAttachment.Attachment.SysFileExtension,
                                SysFileName: source.MainAttachment.Attachment.SysFileName,
                                SysFilePath: source.MainAttachment.Attachment.SysFilePath,
                                UploadedOnCloud: source.MainAttachment.Attachment.UploadedOnCloud,
                                dmsFileExtension: source.MainAttachment.Attachment.dmsFileExtension,
                                dmsFileId: source.MainAttachment.Attachment.dmsFileId,
                                dmsFileName: source.MainAttachment.Attachment.dmsFileName,
                                dmsFolderPath: source.MainAttachment.Attachment.dmsFolderPath,
                                dmsRepoId: source.MainAttachment.Attachment.dmsRepoId
                            }
                            : null
                    }
                    : null,
               
                    Team: (source.Team || []).map(draw => ({
                        CostingTeamGuid: null,
                        Parent_CostingHeaderUUID: null,
                        User_UserGuid: draw.User_UserGuid ?? null,
                        DelMark: 0,
                        RoleGuid_RoleGuid: draw.RoleGuid_RoleGuid ?? null,
                        RoleCode: draw.RoleCode ?? null,
                        RoleName: draw.RoleName ?? null,
                        UserName: draw.UserName ?? null,
                        DepartmentName: draw.DepartmentName ?? null,
                        SubDepartmentName: draw.SubDepartmentName ?? null,
                        UserMaterialCategoryCode: draw.UserMaterialCategoryCode ?? null,
                        UserMaterialCategoryName: draw.UserMaterialCategoryName ?? null,
                        ProductCategoryCode: draw.ProductCategoryCode ?? null,
                        ProductCategoryName: draw.ProductCategoryName ?? null,
                        ProductCatGuid_ProductCategoryGuid: draw.ProductCatGuid_ProductCategoryGuid ?? null,
                        RowNumber: draw.RowNumber ?? null,
                        MenuName: draw.MenuName ?? "CAD"
                    })),
                    MaterialCategory: (source.Material || []).map(m => ({
                        CostingMaterialCategoryGuid: null,
                        Parent_CostingHeaderUUID: null,
                        RowNumber: m.RowNumber ?? null,
                        MaterialCategoryCode: m.MaterialAutoCode ?? null,
                        MaterialCategoryName: m.MaterialCatHanaText ?? null,
                        MaterialCatFreeText: m.MaterialCatFreeText ?? null,
                        Remarks: m.Remarks ?? null,
                        DelMark: 0,

                    })),
                    Assembly: (source.Assembly || []).map(A => ({
                        CostingAssemblyUUID: null,
                        ItemCode: A.ItemCode ?? null,
                        ItemName: A.ItemName ?? null,
                        OHAmount: A.OHAmount ?? null,
                        OHPercent: A.OHPercent ?? null
                    })),
                    ImportedAccessory: (source.ImportedAccessory || []).map(IP => ({
                        CostingImportedAccessoryUUID: null,
                        ItemName: IP.ItemName ?? null,
                        ItemCode: IP.ItemCode ?? null,
                        Cost: IP.Cost ?? null,
                        Qty: IP.Qty ?? null,
                        UnitCost: IP.UnitCost ?? null,
                        UOMCode: IP.UOMCode ?? null
                    })),
                    // MaterialDetails: categories.map(name => {
                    //     const trimmedName = name.trim();


                    //     const match = categoryResult.find(
                    //         cat => cat.MaterialCategoryName.toLowerCase() === trimmedName.toLowerCase()
                    //     );

                    //     return {
                    //         CopMaterialGuid: null,
                    //         Parent_CostingHeaderUUID: null,
                    //         MaterialCategoryCode: match ? match.MaterialCategoryCode : null,
                    //         MaterialCategoryName: trimmedName,
                    //         MaterialCategoryType: match ? match.MaterialCategoryType : null,
                    //     };
                    // }),
                    MaterialDetails: categoryArray.map(type => {
                        const trimmedType = type.trim();

                        const match = categoryResult.find(
                            cat => cat.MaterialCategoryType === type
                        );

                        return {
                            CopMaterialGuid: null,
                            Parent_CostingHeaderUUID: null,
                            MaterialCategoryCode: match ? match.MaterialCategoryCode : null,
                            MaterialCategoryName: match ? match.MaterialCategoryName : null,
                            MaterialCategoryType: trimmedType,
                        };
                    }),
                    MainAssembly: (source.MainAssembly || []).map(main => ({
                        ProductNo: main.ProductNo ?? null,
                        ProductName: main.ProductName ?? null,
                        Quantity: main.Quantity ?? null,
                        QtyUOMCode: main.QtyUOMCode ?? null,
                        QtyISOUOMCode: main.QtyISOUOMCode ?? null,
                        QtyUOMName: main.QtyUOMName ?? null,
                        Weight: main.Weight ?? null,
                        WeightUOMCode: main.WeightUOMCode ?? null,
                        WeightISOUOMCode: main.WeightISOUOMCode ?? null,
                        WeightUOMName: main.WeightUOMName ?? null,
                        PDNumber: main.PDNumber ?? null,
                        SCIPLCode: main.SCIPLCode ?? null,
                        Remarks: main.Remarks ?? null
                    })),

                    Stone: {
                        CostingActualCostDetails: []
                    },
                    Metal: {
                        CostingActualCostDetails: []
                    },
                    Wood: {
                        CostingActualCostDetails: []
                    },
                    // Packaging: [],
                    // ExtraCharges: [],
                    Accessories: {
                        CostingAccessory: []
                    },
                    Other: {
                        CostingActualCostDetails: []
                    }
                };
                (source.MainAssembly || []).forEach(main => {
                    (main.ChildAssembly || []).forEach(child => {
                        const mappedData = {
                            // CostingActualCostDetails: [
                            // {
                            ItemCode: child.Component ?? null,
                            ItemDesc: child.ComponentName ?? null,
                            MaterialCategoryCode: null,
                            MaterialCategoryName: null,
                            MaterialCategoryType: child.Type ?? null,
                            RawMaterialName: child.RawMaterialName ?? null,
                            RawMaterialCode: child.RawMaterialCode ?? null,
                            DimensionLength: child.DimensionLength ?? 0,
                            DimensionWidth: child.DimensionWidth ?? 0,
                            DimensionHeight: child.DimensionHeight ?? 0,
                            SurfaceArea: child.SurfaceArea ?? null,
                            ChildPartWeight: child.ChildPartWeight ?? null,
                            ActWasteAmount: child.ActWasteAmount ?? null,
                            ActWastePercent: child.ActWastePercent ?? null,
                            ChildPartWeight: child.ChildPartWeight ?? null,
                            RMISOUOMCode: child.ComponentISOUOMCode ?? null,
                            RawMaterialQuantity: child.ComponentQuantity ?? null,
                            RMUOMCode: child.ComponentUOMCode ?? null,
                            RMUOMName: child.ComponentUOMName ?? null,
                            Density: child.Density ?? null,
                            OHPrice: child.OHPrice ?? null,
                            OHWasteAmount: child.OHWasteAmount ?? null,
                            OHWastePercent: child.OHWastePercent ?? null,
                            PurchasePrice: child.PurchasePrice ?? null,
                            CostingProcess: (child.ChildProcess || []).map(proc => ({
                                ProcessName: proc.ProcessName ?? null,
                                ProcessType: proc.ProcessType ?? null,
                                ProcessCode: proc.ProcessCode ?? null,
                                ProcessDescription: proc.ProcessDescription ?? null
                                // CostingProcessDetail: (proc.Details || []).map(detail => ({
                                //     SubProcessName: detail.SubProcessName ?? null,
                                //     SubProcessCode: detail.SubProcessCode ?? null,
                                //     SubProcessDesc: null,
                                //     Voltage: detail.Voltage ?? null,
                                //     Temperature: detail.Temperature ?? null,
                                //     UOMName: detail.UOMName ?? null,
                                //     Rate: detail.Rate ?? null,
                                //     Percentage: detail.Percentage ?? null,
                                //     ProcessCost: detail.ProcessCost ?? null,
                                //     // ManualCost: null,
                                //     ContractorProfit: detail.ContractorProfit ?? null,
                                //     OverheadPercentage: detail.OverheadPercentage ?? null,
                                //     WastagePercentage: detail.WastagePercentage ?? null,
                                //     OverheadCost: null,
                                //     WastageCost: null,
                                //     ProcessType: null,
                                //     InputMethod: null,
                                //     SubProcessTotalCost: null
                                // }))
                            }))
                            // }
                            // ]
                        };
                        if (child.Type === "ZRMS") {
                            target.Stone.CostingActualCostDetails.push(mappedData);
                        } else if (child.Type === "ZRMM") {
                            target.Metal.CostingActualCostDetails.push(mappedData);
                        } else if (child.Type === "ZRMW") {
                            target.Wood.CostingActualCostDetails.push(mappedData);
                        } else if (child.Type === "ZRMP") {
                            //     target.Packaging.push(mappedData);
                        } else if (child.Type === "ZRMA") {
                            //     target.Accessories.push(mappedData);
                        } else {
                            if (child.Component !== null && child.Component !== undefined) {

                                target.Other.CostingActualCostDetails.push(mappedData)
                            }
                        }
                    });
                });

                (source.MainAssembly || []).forEach(main => {
                    (main.ChildAssembly || []).forEach(child => {
                        const mappedData = {

                            ItemCode: child.Component ?? null,
                            ItemName: child.ComponentName ?? null,
                            Dimension: null,
                            Qty: child.ComponentQuantity ?? null,
                            UOMCode: child.ComponentUOMCode ?? null,
                            UOMName: child.ComponentUOMName ?? null,
                            UnitPrice: child.PurchasePrice ?? null,
                            MaterialCategoryType: child.Type ?? null,
                            UnitCost: null,
                            ProductPercent: null,
                            JobWorkChargeFirst: null,
                            JobWorkChargeSecond: null,
                            JobWorkChargeThird: null,
                            AssemblyFittingCharges: null,
                            TotalCharges: null,
                            OverHeadPercent: null,
                            OHAmount: child.OHPrice ?? null,
                            WastagePercent: child.ActWastePercent ?? null,
                            WastageCost: null,
                            TotalCostIncludeAllProcess: null
                        };

                        if (child.Type === "ZRMA") {
                            if (child.Component !== null && child.Component !== undefined) {
                                target.Accessories.CostingAccessory.push(mappedData);
                            }
                        }
                    });
                });

                return target;
            }


            const result = await SELECT.from(CUserMaterialCategory).where(`MaterialCategoryType IS NOT NULL`);
            const costingPayload = await mapCadDetailToCostingPayload(Data, result);
            // costingPayload.ExtraCharges.CostingExtraCharges[0].Curreny = costingPayload.BuyerCur
            const keyMap = {
                Stonefactoryoverhead: "Stone.StoneFactoryOverHeadPercentage",
                Metalfactoryoverhead: "Metal.MetalFactoryOverHeadPercentage",
                Woodfactoryover: "Wood.WoodFactoryOverHeadPercentage",
                Otherfactoryoverhead: "Other.OtherMaterialFactoryOverHeadPercentage",

                Assemblyoverhead: "Assembly[0].OHPercent",
                Packingoverhead: "Packaging.CostingPackaging[0].OverheadPercentage",
                Costpercbm: "Packaging.CostingPackaging[0].CostPerCBM",

                Profit: "ExtraCharges.CostingExtraCharges[0].ProfitPercentage",

                Exchangerate: "ExtraCharges.CostingExtraCharges[0].ExchangeRate",
                Currency: "ExtraCharges.CostingExtraCharges[0].Curreny"
            };
            let url = `/sap/opu/odata4/sap/zune_sb_buyerinfo_api/srvd_a2x/sap/zune_sd_buyerinfo_api/0001/ZUNE_PV_BUYERINFO_API?$filter=Buyercode eq '${costingPayload.BuyerCode}' & Currency eq '${costingPayload.BuyerCur}'`
            const buyerApiData1 = await commonfun.callApiUsingDestination('S4HANA_QA', url);
            let buyerApiData = buyerApiData1.value[0]
            buyerApiData.Currency = costingPayload.BuyerCur
            const costingPayloadwithBuyerDetailsUpdate = await mapUsingKeyMap(costingPayload, buyerApiData, keyMap);

            console.log(JSON.stringify(costingPayloadwithBuyerDetailsUpdate, null, 2));

            const COPService = await cds.connect.to('StonemanCOPService');

            let aUploadFileResponse = await COPService.run(

                INSERT.into('StonemanCOPService.TCostingHeader').entries(costingPayloadwithBuyerDetailsUpdate)

            );

            console.log("COP Post ====================> ", aUploadFileResponse)

        }
    });

    async function SendNotification(oData) {
        // Stage transitions mapped directly to message templates
        const stageMessageMap = {
            "CAD_AUTO_DRAFT": (FormNumber) => `A new CAD form (${FormNumber}) has been generated in Draft status.`,
            "CAD_AUTO_DRAFT-CAD_FORMFILL": (FormNumber) => `You have been assigned a new CAD form (${FormNumber}) by the DTP Head.`,
            "CAD_FORMFILL-CAD_FORM_APPROVAL": (FormNumber) => `A new CAD form (${FormNumber}) requires your review. Please check and take action.`,
            "CAD_FORM_APPROVAL-CAD_FORMFILL": (FormNumber) => `Your CAD form (${FormNumber}) has been rejected. Please review the remarks and take corrective action.`,
            "CAD_FORM_APPROVAL": (FormNumber) => `The CAD form (${FormNumber}) has been auto-approved by the system.`
        };

        // Function to get notification message
        function getNotificationMessage(prevStage, currStage, FormNumber) {
            const key = prevStage ? `${prevStage}-${currStage}` : `${currStage}`;
            const msgFunc = stageMessageMap[key];
            return msgFunc ? msgFunc(FormNumber) : null;
        }

        // Helper to build notification payload
        function buildNotificationPayload({ oData, userGuid, message }) {
            return {
                DocumentGUID: oData.CadDetailUUID,
                DocumentNo: oData.CadDetailNo,
                Menu_MenuGuid: oData.MMenu_MenuGuid,
                NotificatoinMessage: message,
                User_UserGuid: userGuid,
                Read: false,
                Clear: false,
                Status: 'Pending',
                DateTime: new Date().toISOString().slice(0, 19)
            };
        }

        NotificationArray.currStage = oData.CadStageName;
        NotificationArray.currStageGuid = oData.CadStageCode_StageGuid;

        if ((NotificationArray.currStage !== NotificationArray.prevStage && oData.SaveOrSubmit === "SUBMIT") || oData.SaveOrSubmit === "Draft") {

            // Handle Draft case
            if (oData.SaveOrSubmit === "Draft") {
                let firtStageGuid = await commonfun.getDataFromTable({
                    tableName: 'CTemplateStage',
                    conditions: [
                        ['Parent_TemplateGuid', '=', oData.Template_TemplateGuid],
                        ['DelMark', '=', '0'],
                        ['StageSeqId', '=', '1']
                    ],
                    columns: ["Stage_StageGuid", "Stage.StageCode as StageCode"]
                });

                if (!firtStageGuid || firtStageGuid.length === 0) {
                    console.warn("No first stage found for template", oData.Template_TemplateGuid);
                    return;
                }

                NotificationArray.currStage = firtStageGuid[0].StageCode;
                NotificationArray.currStageGuid = firtStageGuid[0].Stage_StageGuid;

                let FormNumber = oData.CadDetailNo ?? null;
                const currentDateTime = new Date().toISOString().slice(0, 19);

                let matchedUsers = await commonfun.getDataFromTable({
                    tableName: 'MUser',
                    conditions: [
                        ['UserRoleCode', '=', "DTP_HEAD"],
                        ['DelMark', '=', '0']
                    ],
                    columns: ["UserGuid"]
                });

                const TNotificationPayloadDraft = matchedUsers.map(user =>
                    buildNotificationPayload({
                        oData,
                        userGuid: user.UserGuid,
                        message: getNotificationMessage(null, NotificationArray.currStage, FormNumber)
                    })
                );

                if (TNotificationPayloadDraft.length === 0) {
                    return;
                }

                try {
                    const CrfService = await cds.connect.to('StonemanCRFService');
                    await CrfService.run(
                        INSERT.into('StonemanCRFService.TNotification').entries(TNotificationPayloadDraft)
                    );
                } catch (err) {
                    console.error("Failed to insert Draft notification:", err);
                }
            }

            console.log("Send Notification Function Call", NotificationArray);

            let Stagedetails = await commonfun.getDataFromTable({
                tableName: 'CStageRole',
                conditions: [
                    ['Stage_StageGuid', '=', oData.CadStageCode_StageGuid],
                    ['DelMark', '=', '0']
                ],
                columns: ["Stage_StageGuid", "StageCode", "RoleCode", "Role_RoleGuid"]
            });
            console.log("Stagedetails", Stagedetails);

            const team = oData.Team ?? [];
            const AT = oData.ApprovalTransaction ?? [];

            // Collect role codes from StageDetails
            const stageRoleCodes = Stagedetails.map(s => s.RoleCode);

            // Filter team members matching StageDetails
            const filteredTeam = team.filter(t => stageRoleCodes.includes(t.RoleCode));

            // Filter AT users matching filteredTeam & current StageGuid
            const filteredAT = [
                ...new Map(
                    AT.flatMap(stage =>
                        (stage.DataFlow ?? [])
                            .filter(df =>
                                filteredTeam.some(t => t.User_UserGuid === df.User_UserGuid) &&
                                stage.Stage_StageGuid === NotificationArray.currStageGuid
                            )
                            .map(df => ({
                                UserGuid: df.User_UserGuid,
                                StageGuid: stage.Stage_StageGuid
                            }))
                    ).map(item => [item.UserGuid, item])
                ).values()
            ];

            // Match users from both team & AT
            const matchedUsers = filteredTeam.flatMap(t =>
                filteredAT
                    .filter(a => a.UserGuid === t.User_UserGuid)
                    .map(() => ({ UserGuid: t.User_UserGuid }))
            );

            console.log("Matched Users:", matchedUsers);

            let prevStage = NotificationArray.prevStage ?? null;
            let currStage = NotificationArray.currStage ?? null;
            let FormNumber = oData.CadDetailNo ?? null;

            const TNotificationPayload = matchedUsers.map(user =>
                buildNotificationPayload({
                    oData,
                    userGuid: user.UserGuid,
                    message: getNotificationMessage(prevStage, currStage, FormNumber)
                })
            );

            if (TNotificationPayload.length > 0) {
                try {
                    const CrfService = await cds.connect.to('StonemanCRFService');
                    await CrfService.run(
                        INSERT.into('StonemanCRFService.TNotification').entries(TNotificationPayload)
                    );
                } catch (err) {
                    console.error("Failed to insert notifications:", err);
                }
            }

            // Auto-approved case
            if (oData.SaveOrSubmit === "SUBMIT" &&
                NotificationArray.isAutoApproved &&
                oData.CreatedByUserID_UserGuid === oData.loginUserID_UserGuid) {

                const TNotificationPayloadApproved = buildNotificationPayload({
                    oData,
                    userGuid: oData.CreatedByUserID_UserGuid,
                    message: getNotificationMessage(null, NotificationArray.currStage, oData.CadDetailNo)
                });

                if (!TNotificationPayloadApproved) {
                    return;
                }

                try {
                    const CrfService = await cds.connect.to('StonemanCRFService');
                    await CrfService.run(
                        INSERT.into('StonemanCRFService.TNotification').entries(TNotificationPayloadApproved)
                    );
                } catch (err) {
                    console.error("Failed to insert Auto-Approved notification:", err);
                }
            }
        }
    }
    /**
     * Map values from sourceData to targetData using a provided keyMap.
     * keyMap supports nested paths like "Stone.StoneFactoryOverHead"
     */
    function mapUsingKeyMap_Single(targetData, sourceData, keyMap) {
        for (const sourceKey in keyMap) {
            const targetPath = keyMap[sourceKey];  // Example: "Stone.StoneFactoryOverHead"
            const value = sourceData[sourceKey];

            if (value === undefined) continue;

            setValueByPath(targetData, targetPath, value);
        }

        return targetData;
    }
    function mapUsingKeyMap_Old(targetData, sourceData, keyMap) {

        function setValue(target, path, value) {
            const parts = path.split(".");
            let current = target;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

                // -------- ARRAY DETECTED --------
                if (arrayMatch) {
                    const prop = arrayMatch[1];

                    if (!Array.isArray(current[prop])) {
                        current[prop] = [];
                    }

                    // Last step → apply value to ALL items in array
                    if (i === parts.length - 1) {
                        current[prop].forEach(item => {
                            item[arrayMatch[1]] = value; // example: item["OverheadPercentage"]
                        });
                        return;
                    }

                    // Not last → go deeper for EACH item in array
                    current[prop].forEach(item => {
                        setValue(item, parts.slice(i + 1).join("."), value);
                    });

                    return;
                }

                // -------- NORMAL PATH --------
                if (i === parts.length - 1) {
                    current[part] = value;
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            }
        }

        // -------- MAIN MAPPING LOOP --------
        for (const sourceKey in keyMap) {
            if (!sourceData.hasOwnProperty(sourceKey)) continue;

            const targetPath = keyMap[sourceKey];
            const value = sourceData[sourceKey];

            if (value === undefined || value === null) continue;

            setValue(targetData, targetPath, value);
        }

        return targetData;
    }
    function mapUsingKeyMap(targetData, sourceData, keyMap) {

        function setValue(target, path, value) {
            const parts = path.split(".");
            let current = target;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

                // ---------- ARRAY CASE ----------
                if (arrayMatch) {
                    const arrayProp = arrayMatch[1];  // e.g., "CostingPackaging"
                    const index = parseInt(arrayMatch[2]); // 0

                    // Create array if missing
                    if (!Array.isArray(current[arrayProp])) {
                        current[arrayProp] = [];
                    }

                    const arr = current[arrayProp];

                    // If array has NO items → create ONE item
                    if (arr.length === 0) {
                        arr.push({});
                    }

                    // If last part → set value in ALL existing items
                    if (i === parts.length - 1) {
                        const finalProp = part.split("].")[1]; // get last property name

                        arr.forEach(item => {
                            item[finalProp] = value;
                        });

                        return;
                    }

                    // Not last → go deeper inside each item
                    const remainingPath = parts.slice(i + 1).join(".");

                    arr.forEach(item => {
                        setValue(item, remainingPath, value);
                    });

                    return;
                }

                // ---------- NORMAL PROPERTY ----------
                if (i === parts.length - 1) {
                    current[part] = value;
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            }
        }

        // ---------- MAIN LOOP ----------
        for (const sourceKey in keyMap) {
            if (!sourceData.hasOwnProperty(sourceKey)) continue;

            const value = sourceData[sourceKey];
            if (value === undefined || value === null) continue;

            const targetPath = keyMap[sourceKey];
            setValue(targetData, targetPath, value);
        }

        return targetData;
    }



    /**
     * Sets a value inside an object using "dot notation" path
     * Example: setValueByPath(obj, "Stone.StoneFactoryOverHead", 10)
     */
    function setValueByPath(obj, path, value) {
        const parts = path.split(".");
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            let part = parts[i];

            // Check for array notation -> Example: ExtraCharges.CostingExtraCharges[0]
            const arrayMatch = part.match(/(\w+)\[(\d+)\]/);

            if (arrayMatch) {
                const arrKey = arrayMatch[1];
                const index = parseInt(arrayMatch[2], 10);

                // Create array if it does not exist
                if (!current[arrKey]) {
                    current[arrKey] = [];
                }

                // Create empty object at the index if missing
                if (!current[arrKey][index]) {
                    current[arrKey][index] = {};
                }

                current = current[arrKey][index];
            } else {
                // Create nested object if missing
                if (!current[part]) {
                    current[part] = {};
                }

                current = current[part];
            }
        }

        // Always store as 2-decimal numeric value
        const finalValue =
            typeof value === "number" || (!isNaN(value) && value !== "")
                ? Number(parseFloat(value).toFixed(2))
                : value;

        current[parts[parts.length - 1]] = finalValue;
    }

    service.on('GetEnableDisable', async (req) => {
        const { DocumentGuid, LoginGuid, RoleGuid, StageGuid } = req.data;
        let dbQuery = `
      CALL "STONEMEN_CADGETENABLEANDDISABLECONTROLS"(
        '${DocumentGuid}',
        '${LoginGuid}',
        '${RoleGuid}',
        '${StageGuid}',
        EnableTable => ?
      )
    `;
        let result = await db.run(dbQuery);

        return result.ENABLETABLE;
    });

    service.on('GetProcessData', async (req) => {
        const { Type } = req.data;
        let Data;
        const EXCLUDED_TYPES = ["ZRMA", "ZRMS", "ZRMW", "ZRMM", "ZRMP"];

        if (EXCLUDED_TYPES.includes(Type)) {
            // Data = await SELECT.from(MProcess).where({ MaterialCategoryType: Type });
            Data = await SELECT
                .from(MProcess)
                .where({ MaterialCategoryType: Type })
                .columns([
                    '*',
                    {
                        ref: ['Detail'],
                        expand: ['*'],
                        where: [{ ref: ['IsAction'] }, '=', { val: true }]
                    }
                ]);



        } else {
            // Data = await SELECT.from(MProcess).where({ MaterialCategoryType: { 'not in': EXCLUDED_TYPES } });
            Data = await SELECT
                .from(MProcess)
                .where({ MaterialCategoryType: { 'not in': EXCLUDED_TYPES } })
                .columns([
                    '*',
                    {
                        ref: ['Detail'],
                        expand: ['*'],
                        where: [{ ref: ['IsAction'] }, '=', { val: true }]
                    }
                ]);

        }

        return Data

    })

});