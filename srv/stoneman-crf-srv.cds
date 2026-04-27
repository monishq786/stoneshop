using {Stonemen as db} from '../db/stonemen-schema';

service StonemanCRFService {


    entity TCrfHeader                 as projection on db.DCrfHeader;
    entity TCrfInspDrawDetail         as select from db.CCrfAttachment;
    //entity TCrfAttachmentDetail          as select from db.TCrfAttachmentDetail;
    entity TCrfUserAssignDetail       as select from db.CCrfMeetingDetail;
    //entity TCrfApprovalTransaction       as select from db.TCrfApprovalTransaction;
    entity TcrfSeekAdvice             as select from db.CCrfSeekAdvice;
    entity TcrfMaterial               as select from db.CCrfMaterial;
    entity TCrfBrand                  as projection on db.CCrfBrand;
    entity TCrfTeam                   as projection on db.CCrfTeam;
    entity MRole                      as select from db.MRole;
    entity MMenu                      as select from db.MMenu;
    entity MUser                      as select from db.MUser;
    entity MCodeName                  as select from db.MCodeName;
    entity CUserBuyer                 as select from db.CUserBuyer;
    entity CUserMaterialCategory      as select from db.CUserMaterialCategory;
    entity CUserProductCategory       as select from db.CUserProductCategory;
    entity MStage                     as projection on db.MStage;
    entity MStageRole                 as select from db.CStageRole;
    entity MMenuRoleAccess            as projection on db.MMenuRoleAccess;
    entity CMenuRoleAccessDetail      as select from db.CMenuRoleAccessDetail;
    entity MEnum                      as select from db.MEnum;
    entity DAttachment                as select from db.DAttachment;
    entity CFormControlSubMenu1Detail as select from db.CFormControlSubMenu1Detail;
    entity CFormControlSubMenu2Detail as select from db.CFormControlSubMenu2Detail;
    entity MCrfControls               as select from db.MCrfControls;
    entity MCrfControlDetail          as select from db.MCrfControlDetail;
    entity MEmailTemplate             as projection on db.MNotifyTemplate;
    entity TNotification              as select from db.TNotification;
    entity MBuyer                     as projection on db.MBuyer; //*now
    entity CBuyerBrand                as projection on db.CBuyerBrand;
    entity DTemplate                  as select from db.DTemplate;
    entity CTemplateMenu              as select from db.CTemplateMenu;
    entity CTemplateStage             as select from db.CTemplateStage;
    entity DData                      as select from db.DData;
    entity CDataFlow                  as select from db.CDataFlow;
    // entity TForgotPassword            as projection on db.TForgotPassword;
    /*==================Cad Detail Schema*============================*/
    // entity TCadDetail                    as select from db.TCadDetail;
    // entity TCadDetailSeekAdvice          as select from db.TCadDetailSeekAdvice;
    // entity TCadDetailInspDrawDetail      as select from db.TCadDetailInspDrawDetail;
    // entity TCadDetailApprovalTransaction as select from db.TCadDetailApprovalTransaction;
    // entity TCadDetailMaterial            as select from db.TCadDetailMaterial;
    // entity TCadMainAssembly              as select from db.TCadMainAssembly;
    // entity TCadSubAssembly               as select from db.TCadSubAssembly;
    // entity TCadChildAssembly             as select from db.TCadChildAssembly;
    entity MManufacturing             as select from db.MManufacturing;
    entity MOperationProcess          as select from db.CManufacturingOpDetail;
    entity MProductCategory           as projection on db.MProductCategory;
    entity MEmailParent               as projection on db.MEmailParent;
    entity CEmailChild                as projection on db.CEmailChild;
    action   MyDocuments(guid: UUID, BUYERCODE: String, CRFREQNO: Integer, CRFSTATUS: String, CRFREQDATE: String, Techno: UUID)                                                             returns array of String;

    // action   GetCrfSearchData(guid : UUID, BUYERCODE : String, CRFREQNO : Integer, CRFSTATUS : String, CRFREQDATE : String, Techno : UUID)      returns array of String;
    // action   MyCADDetailDocuments(guid : UUID,
    //                               BUYERCODE : String,
    //                               CADDETAILNO : Integer,
    //                               CRFSTATUS : String,
    //                               CRFREQDATE : String,
    //                               Techno_Guid : UUID,
    //                               PDCNo_Guid : UUID)                                                                                                  returns array of String;

    action   EnableAndDisable(CRFGUID: UUID, LOGINGUID: UUID, ROLECODE: String, STAGECODE: String)                                                                                          returns array of String;
    action   EnableAndDisableForCAD(CADGUID: UUID, LOGINGUID: UUID, ROLECODE: String, STAGECODE: String)                                                                                    returns array of String;
    function Demo(Date: Date, Name: String)                                                                                                                                                 returns String;

    // action CRF_Search(LOGINUSERID : UUID,BUYERNAME:String,CRFREQNO :Integer,CRFSTATUS: String,CRFREQDATE:String,TECHNOUSERID:UUID) returns array of String;
    // action CAD_Search(LOGINUSERID : UUID,BUYERNAME:String,CADDETAILNO :Integer,CRFSTATUS:String,CRFREQDATE:String,TECHNOUSERID:UUID) returns array of String;
    /*=====================Costing one pager*===========================*/
    // entity TCostingHeader                as select from db.TCostingHeader;
    // entity TCostingCADAccessory          as select from db.TCostingCADAccessory;
    // // entity TCostingStoneTotals                    as select from db.TCostingStoneTotals;
    // entity TCostingStoneActualCostDetail as select from db.TCostingStoneActualCostDetail;
    // entity TCostingStoneBaseCostDetail   as select from db.TCostingStoneBaseCostDetail;
    // entity TCostingStoneProcessDetail    as select from db.TCostingStoneProcessDetail;
    // // entity TCostingMetalTotals                    as select from db.TCostingMetalTotals;
    // entity TCostingMetalActualCostDetail as select from db.TCostingMetalActualCostDetail;
    // entity TCostingMetalBaseCostDetail   as select from db.TCostingMetalBaseCostDetail;
    // entity TCostingMetalProcessDetail    as select from db.TCostingMetalProcessDetail;
    // // entity TCostingWoodTotals                     as select from db.TCostingWoodTotals;
    // entity TCostingWoodBaseCostDetail    as select from db.TCostingWoodBaseCostDetail;
    // entity TCostingWoodProcessDetail     as select from db.TCostingWoodProcessDetail;
    // entity TCostingAccessory             as select from db.TCostingAccessory;
    // entity TCostingExtraCharges          as select from db.TCostingExtraCharges;
    // entity TCostingApprovalTransaction   as select from db.TCostingApprovalTransaction;

    // entity CostingWoodActualCostDetail as select from db.TCostingWoodActualCostDetail;
    //LOGINUSERID : UUID,BUYERNAME:String,CRFREQNO :Integer,CRFSTATUS: String,CRFREQDATE:String,TECHNOUSERID:UUID
    //function CRF_Search(LOGINUSERID : UUID, BUYERCODE : String, CRFREQNO : Integer, CRFSTATUS : String, CRFREQDATE : Date, TECHNOUSERID : UUID) returns array of String;
    // function CAD_Search(LOGINUSERID : UUID, BUYERCODE : String, CADDETAILNO : Integer, CRFSTATUS : String, CRFREQDATE : Date, TECHNOUSERID : UUID, PDCOORDINATOR : UUID)                                                                returns array of String;
    // action   COP_Search(LOGINUSERID : UUID, CADNO : Int64, ITEMCODE : String, SCIPLCODE : String, ITEMDES : String, BUYERNAME : String, COSTINGCATEGORY : String, PRODUCTSUBCATEGORY : String, RAWMATERIAL : String, CostingNo : Int64) returns array of String;

    action   PDRM_Check_UserAvailability(UserAssign: array of {
        UserID_UserGuid   : UUID;
        Parent_CrfReqGuid : UUID;
        MeetingStartDate  : Timestamp;
        MeetingEndDate    : Timestamp;
        UserAvailable     : String;
        CallMeeting       : String;
    })                                                                                                                                                                                      returns array of String;

    action   AlterNotificationClear(NotificationData: array of {
        NotificationID : UUID;
        Read           : Boolean;
        Clear          : Boolean
    });

    @cds.redirection.target: 'StonemanCRFService.Header'
    entity GetCrfSearchData_1         as
        projection on db.DCrfHeader {
            CrfReqGuid,
            CrfReqNo,
            InputType,
            BuyerName,
            CrfStatus,
            ReqTyp

        }

    action   getUSPUsersForSelectionOnCrf(BUYERCODE: String, PRODCATEGORYGUID: UUID, CRFSTPRODCATEGORYCODE: String, MATERIALCATEGORYCODE: String, STAGECODE: Int16, TEMPLATEGUID: UUID)     returns array of String;
    action   GetCrfSearchData(guid: UUID, BUYERNAME: String, CRFREQNO: Integer, CRFSTATUS: String, CRFREQDATE: String, REQTYPE: String, REFCRFREQNO: Integer, PDNO: String, PDNAME: String) returns array of String;
    action   GetTemplate(MenuSubType: String, MenuCode: String)                                                                                                                             returns array of String;
    action   DocumentFieldsEnableDisable(DOCUMENTGUID: UUID, LOGINGUID: UUID, ROLEGUID: UUID, STAGEGUID: UUID)                                                                              returns array of String;

    action   ProductGetCadLevel(ProductCategoryGuid: UUID, CADLevelCode: String, CRFDATE: Date)                                                                                             returns array of String;
    entity MProductSubCat             as projection on db.MProductSubCat;
    entity TCrfProductSubCat          as projection on db.CCrfProductSubCat;
    action   getSubProductField(ProductCatCode: String)                                                                                                                                     returns array of String;
    // action validateUser(email: String) returns String;
    //  action validateOTP(email: String,OTP:Integer) returns String;
    //  action UpdatePassword(email: String,password:String) returns String;

    entity MBuyerProductCat           as projection on db.MBuyerProductCat;
    entity CBuyerProductCatUser       as projection on db.CBuyerProductCatUser;
    // for testing we are adding testEmployee below
    entity testEmployee               as projection on db.testEmployee;
    entity MProcess                   as projection on db.MProcess;
    entity CProcessDetails            as projection on db.CProcessDetails;

    entity XProcessUser               as projection on db.XProcessUser;
}
