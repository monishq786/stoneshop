namespace Stonemen;

using {managed} from '@sap/cds/common';

entity MStage : managed {
    key StageGuid           : UUID;
        StageCode           : String;
        Description         : String;
        IsApproval          : Enum_YesNo default 'N';
        SendEmail           : Enum_YesNo default 'Y';
        SendAppNotification : Enum_YesNo default 'Y';
        NoOfApprovals       : Int16 default-1;
        NoOfRejections      : Int16 default-1;
        // MaterialCategoryName : String;
        // MaterialCategoryCode :String;
        // MaterialCategoryType : String;
        DelMark             : Enum_DelMark default 0;
        Remarks             : String;
        Role                : Composition of many CStageRole
                                  on Role.Stage = $self;
}

entity CStageRole : managed {
    key StageRoleGuid : UUID;
        Stage         : Association to one MStage;
        StageCode     : String = Stage.StageCode;
        RoleCode      : String = Role.RoleCode;
        Role          : Association to one MRole;
        DelMark       : Enum_DelMark default 0;
        Remarks       : String;
        // RoleType      : Int32 default 0; //TCM
        RoleType      : String default '0'; // Rishiraj
        RowNumber     : Int64;
}

entity MEnum : managed {
    key EnumGuid        : UUID;
        EnumCode        : String;
        EnumDescription : String;
        EnumType        : String;
}

entity MEmp : managed {
    key EmpGuID : UUID;
        EmpID   : Integer;
        EmpName : String;
        cEmpEdu : Composition of many CEmpEdu
                      on cEmpEdu.mEmp = $self;
        cEmpFam : Composition of many CEmpFam
                      on cEmpFam.mEmp = $self;
}

entity CEmpEdu : managed {
    key EduGuid  : UUID;
        EduID    : Integer;
        DegreeID : Integer;
        YOP      : Integer;
        mEmp     : Association to one MEmp;
}

entity CEmpFam : managed {
    key FamGuid      : UUID;
        FamID        : Integer;
        MemName      : Integer;
        RelationType : Integer;
        mEmp         : Association to one MEmp;
}

entity MReferenceType : managed {
    key ReferenceGuid : UUID;
        TableCode     : String null;
        TableName     : String null;
        TableDesc     : String null;
        DelMark       : Enum_DelMark default 0;
        Remarks       : String null;
}

entity DMSConfig : managed {
    key repoGuid   : UUID;

        @assert.unique
        @cds.persistence.unique
        repoName   : String(100);
        repoId     : String(100);
        folderName : String(100);
        folderId   : String(100);
}

//ADNOC
// entity DAttachment : managed {
//     key attachmentGuId   : UUID;
//         attachmentName   : String(100); // name with Ext.
//         orgFileName      : String(100); // User Provided name
//         orgFileExtension : String(10); // User Provided Ext.
//         docType          : Integer;
//         docId            : Integer;
//         docGuid          : UUID;
//         dmsFileId        : String(100);
//         dmsFileName      : String(250); // generated name with uuid
//         dmsFileExtension : String(100);
//         dmsFolderPath    : String(250);
//         dmsRepoId        : String(100);
//         remarks          : String(250);
// }

//Stonemen
entity DAttachment : managed {
    key AttachmentGuId   : UUID;
        AttachmentName   : String;
        OrgFileName      : String;
        OrgFileExtension : String;
        SysFileName      : String;
        SysFileExtension : String;
        ReferenceType    : Integer;
        ReferenceId      : Integer;
        ReferenceGuid    : UUID;
        SysFilePath      : String;
        UploadedOnCloud  : Enum_YesNo default 'N';
        DelMark          : Enum_DelMark default 0;
        Remarks          : String;
        // for DMS
        dmsFileId        : String(100);
        dmsFileName      : String(250);
        dmsFileExtension : String(100);
        dmsFolderPath    : String(250);
        dmsRepoId        : String(100);
}

entity MManufacturing : managed {
    key ManufacturingGuid : UUID;
        ManufacturingCode : String;
        ManufacturingName : String;
        Operation         : Composition of many CManufacturingOpDetail
                                on Operation.Parent = $self;
        DelMark           : Enum_DelMark default 0;
        Remarks           : String;
}

entity CManufacturingOpDetail : managed {
    key ManufacturingOpDetailGuid : UUID;
        OperationProcessCode      : String;
        OperationProcessName      : String;
        Parent                    : Association to one MManufacturing;
        DelMark                   : Enum_DelMark default 0;
        Remarks                   : String;
}

entity MeetingConfig : managed {
    key MeetingConfigGuid : UUID;
        TimeSlotMinutes   : Integer;
        StartTime         : Timestamp;
        EndTime           : Timestamp;
        DelMark           : Enum_DelMark default 0;
        Remarks           : String;
}

entity MMenu : managed {
    key MenuGuid       : UUID;
        MenuCode       : String;
        Description    : String;
        ParentMenuCode : String = ParentMenuGuid.MenuCode; // default-1;
        ParentMenuGuid : Association to one MMenu;
        MenuIcon       : String;
        MenuPath       : String;
        OrderBy        : Integer;
        DelMark        : Enum_DelMark default 0;
        Remarks        : String;
        Role           : Composition of many CMenuRoleAccessDetail
                             on Role.Menu = $self;
        IsActive       : Enum_YesNo default 'Y';

}

entity MRole : managed {
    key RoleGuid    : UUID;
        RoleCode    : String not null;
        Description : String;
        DelMark     : Enum_DelMark default 0;
        Remarks     : String;
        Menu        : Composition of many MMenuRoleAccess
                          on Menu.Role = $self;
        Stage       : Association to many CStageRole
                          on Stage.Role = $self;
}

entity MMenuRoleAccess : managed {
    key MenuRoleAccessGuid : UUID;
        Role               : Association to one MRole;
        RoleCode           : String = Role.RoleCode;
        DelMark            : Enum_DelMark default 0;
        Remarks            : String;
        Detail             : Composition of many CMenuRoleAccessDetail
                                 on Detail.Parent = $self;
}

entity CMenuRoleAccessDetail : managed {
    key MenuRoleAccessDetailGuid : UUID;
        Parent                   : Association to one MMenuRoleAccess;
        Menu                     : Association to one MMenu;
        MenuCode                 : String = Menu.MenuCode;
        Add                      : Boolean;
        Update                   : Boolean;
        View                     : Boolean;
        DelMark                  : Enum_DelMark default 0;
        Remarks                  : String;
}

entity MUser : managed {
    key UserGuid          : UUID;
        UserName          : String;
        UserCode          : String;
        Password          : String
        @mandatory;
        FirstName         : String;
        LastName          : String;
        EmailId           : String
        @mandatory;
        MobileNo          : String;
        DepartmentCode    : String;
        DepartmentName    : String;
        SubDepartmentCode : String;
        SubDepartmentName : String;
        Buyer             : Composition of many CUserBuyer
                                on Buyer.User = $self;
        Role              : Association to one MRole not null;
        UserRoleCode      : String = Role.RoleCode;
        Designation       : String;
        Manager           : Association to one MUser;
        ManagerName       : String = Manager.UserName;
        DelMark           : Enum_DelMark default 0;
        Remarks           : String;
        MaterialCategory  : Composition of many CUserMaterialCategory
                                on MaterialCategory.Parent = $self;
        ProductCategory   : Composition of many CUserProductCategory
                                on ProductCategory.Parent = $self;
        IsActive          : Enum_YesNo default 'Y';
        processes         : Composition of many XProcessUser
                                on processes.user = $self;
}

entity XProcessUser : managed {
    key ID         : UUID;

        process    : Association to MProcess not null;
        user       : Association to MUser not null;

}

entity CUserMaterialCategory : managed {
    key UserMaterialCategoryGuid : UUID;
        Parent                   : Association to one MUser;
        MaterialCategoryCode     : String;
        MaterialCategoryName     : String;
        MaterialCategoryType     : String;
        DelMark                  : Enum_DelMark default 0;
        Remarks                  : String;
}

entity CUserProductCategory : managed {
    key UserProductCategoryGuid : UUID;
        Parent                  : Association to one MUser;
        ProductCategoryCode     : String;
        ProductCategoryName     : String;
        DelMark                 : Enum_DelMark default 0;
        Remarks                 : String;
        ProductCategoryGuid     : Association to one MProductCategory;
}

entity CUserBuyer : managed {
    key BuyerGuid : UUID;
        BuyerCode : String;
        BuyerName : String;
        User      : Association to one MUser;
        MCatCode  : String;
        MCatName  : String;
        DelMark   : Enum_DelMark default 0;
        Remarks   : String;
}

entity MBuyer : managed {
    key BuyerGuid : UUID;
        BuyerCode : String;
        BuyerName : String;
        Brand     : Composition of many CBuyerBrand
                        on Brand.Parent = $self;
        DelMark   : Enum_DelMark default 0;
        Remarks   : String;
}

entity CBuyerBrand : managed {
    key BuyerBrandGuid : UUID;
        Parent         : Association to one MBuyer;
        BrandCode      : String;
        BrandName      : String;
        DelMark        : Enum_DelMark default 0;
        Remarks        : String;
}

entity MBuyerProductCat : managed {
    key BuyerProductCatGuid : UUID;
        Buyer               : Association to one MBuyer;
        BuyerCode           : String = Buyer.BuyerCode;
        BuyerName           : String = Buyer.BuyerName;
        ProductCategoryCode : String = ProductCategory.ProductCategoryCode;
        ProductCategoryName : String = ProductCategory.ProductCategoryName;
        ProductCategory     : Association to one MProductCategory;
        Detail              : Composition of many CBuyerProductCatUser
                                  on Detail.Parent = $self;
        DelMark             : Enum_DelMark default 0;
        Remarks             : String;
}

entity CBuyerProductCatUser : managed {
    key BuyerProductCatUserGuid : UUID;
        Parent                  : Association to one MBuyerProductCat;
        User                    : Association to one MUser;
        UserName                : String = User.UserName;
        UserRoleCode            : String = User.UserRoleCode;
        DepartmentName          : String = User.DepartmentName;
        SubDepartmentName       : String = User.SubDepartmentName;
        DelMark                 : Enum_DelMark default 0;
        Remarks                 : String;
}

entity DTemplate : managed {
    key TemplateGuid    : UUID;
        TemplateName    : String not null;
        Description     : String null;
        ActiveStartDate : DateTime not null;
        ActiveEndDate   : DateTime not null;
        IsActive        : Enum_YesNo default 'Y ';
        DelMark         : Enum_DelMark default 0;
        Remarks         : String null;
        TemplateStages  : Composition of many CTemplateStage
                              on TemplateStages.Parent = $self;
        TemplateMenus   : Composition of many CTemplateMenu
                              on TemplateMenus.Parent = $self;
}

entity CTemplateStage : managed {
    key TemplateStageGuid : UUID;
        Parent            : Association to one DTemplate;
        Stage             : Association to one MStage;
        StageCode         : String = Stage.StageCode;
        StageSeqId        : Integer;
        DelMark           : Enum_DelMark default 0;
        Remarks           : String;
}

entity CTemplateMenu : managed {
    key TemplateMenuGuid : UUID;
        Parent           : Association to one DTemplate;
        Menu             : Association to one MMenu;
        MenuCode         : String = Menu.MenuCode;
        MenuSubType      : String; //CAD , Rendering, Handwritten
        DelMark          : Enum_DelMark default 0;
        Remarks          : String;
}

entity MCrfControls : managed {
    key ControlsID    : UUID;
        RoleCode      : Association to one MRole;
        RoleCodeName  : String = RoleCode.RoleCode;
        Detail        : Composition of many MCrfControlDetail
                            on Detail.Parent = $self;
        StageCode     : Association to one MStage;
        StageCodeName : String = StageCode.StageCode;
        FormType      : String;
        Category      : String;
        IsActive      : Enum_YesNo default 'Y';
        Menu          : Association to one MMenu;
}

entity MCrfControlDetail : managed {
    key ControlsDetailID : UUID;
        Parent           : Association to one MCrfControls;
        ControlName      : String;
        Enabled          : Boolean default true;
        TableName        : String;
        ControlId        : String;
        IsActive         : Enum_YesNo default 'Y';
        Visible          : Boolean default true;
}

entity MFormControl : managed {
    key FormControlGuid : UUID;
        Detail          : Composition of many CFormControlDetail
                              on Detail.Parent = $self;
        Menu            : Association to one MMenu;
        Scenario        : String;
        Stage           : Association to one MStage;
        Role            : Association to one MRole;
        DelMark         : Enum_DelMark default 0;
        Remarks         : String;
        SubMenu1        : Composition of many CFormControlSubMenu1Detail
                              on SubMenu1.Parent = $self;
        SubMenu2        : Composition of many CFormControlSubMenu2Detail
                              on SubMenu2.Parent = $self;
}

entity CFormControlSubMenu1Detail : managed {
    key FormControlSubMenu1DetailGuid : UUID;
        Parent                        : Association to one MFormControl;
        SubMenu                       : String;
        DelMark                       : Enum_DelMark default 0;
        Remarks                       : String;
}

entity CFormControlSubMenu2Detail : managed {
    key FormControlSubMenu2DetailGuid : UUID;
        Parent                        : Association to one MFormControl;
        SubMenu                       : String;
        DelMark                       : Enum_DelMark default 0;
        Remarks                       : String;
}

entity CFormControlDetail : managed {
    key FormControlDetailGuid : UUID;
        Parent                : Association to one MFormControl;
        ControlId             : String;
        ControlName           : String;
        Enabled               : Boolean default true;
        Visible               : Boolean default true;
        TableName             : String;
        DelMark               : Enum_DelMark default 0;
        Remarks               : String;
}

entity DData : managed {
    key DataGuid         : UUID;
        Template         : Association to one DTemplate;
        ActiveStartDate  : DateTime;
        ActiveEndDate    : DateTime;
        ObjectGuid       : UUID not null;
        Menu             : Association to one MMenu;
        MenuCode         : String  = Menu.MenuCode;
        SubMenu          : String;
        DelMark          : Enum_DelMark default 0;
        Remarks          : String;
        Stage            : Association to one MStage;
        StageCode        : String  = Stage.StageCode;
        StageSeq         : Integer;
        NoOfApprovalReq  : Integer = Stage.NoOfApprovals;
        NoOfRejectionReq : Integer = Stage.NoOfRejections;
        TotalApproved    : Integer not null default 0;
        TotalRejected    : Integer not null default 0;
        ApprovalStatus   : Enum_ApprovalStatus default 'NA';
        //RowStatus : Enum_RowStatus default 'OPEN';
        RowStatus        : Enum_RowStatus default 'NA';
        DataFlow         : Composition of many CDataFlow
                               on DataFlow.Parent = $self;
        IsCurrentStage   : Enum_YesNo default 'N';
        RowNumber        : Integer default 0; //TCM
}

entity CDataFlow : managed {
    key DataFlowGuid         : UUID;
        Parent               : Association to one DData;
        User                 : Association to one MUser;
        UserName             : String = User.UserName;
        RowStatus            : Enum_RowStatus default 'OPEN';
        ApprovalStatus       : Enum_ApprovalStatus default 'NA';
        IsEMailSent          : Enum_YesNo default 'N';
        InAppNotification    : Enum_YesNo default 'N';
        RowNumber            : Int64;
        ProcessDate          : Timestamp;
        StartDate            : Timestamp;
        EndDate              : Timestamp;
        Type                 : String;
        MaterialCategoryName : String;
        MaterialCategoryCode : String;
        MaterialCategoryType : String;
        DelMark              : Enum_DelMark default 0;
        Remarks              : String;
        // UserType          : Enum_UserType default 1;
        UserType             : String default 0; // add by Rishiraj - 20/01/2025
        UserEmail            : String = User.EmailId;
}

// @assert.unique: {NotifyTemplateCode: [ NotifyTemplateCode ]}
entity MNotifyTemplate : managed {
    key NotifyTemplateGuid    : UUID;
        NotifyTemplateCode    : String not null;
        NotifyTemplateSubject : String;
        Description           : String;
        NotifyTemplateBody    : LargeString not null;
        NotificationBody      : LargeString;
        Type                  : String;
        DelMark               : Enum_DelMark default 0;
        Remarks               : String null;
        IsActive              : Enum_YesNo default 'Y ';
        MenuCode              : String;
        MenuGuid              : Association to MMenu;
}

entity MEmailParent : managed {
    key EmailParentGuid    : UUID;
        NotifyTemplateGuid : Association to MNotifyTemplate;
        EmailSubject       : String;
        EmailBody          : LargeString not null;
        EmailFrom          : String;
        DelMark            : Enum_DelMark default 0;
        Status             : String;
        Remarks            : String;
        DocNumber          : Integer64 default 0; //Trupti
        TaskDescription    : String null; //Trupti
        TaskUUID           : UUID null; //Trupti
        DocType            : String; //Trupti CRF/tnA
        EmailPurpose       : String; //Trupti
}

entity CEmailChild : managed {
    key EmailChildGuid  : UUID;
        EmailParentGuid : Association to MEmailParent;
        RecepientEmail  : String;
        EmailType       : String not null; // To , Cc, Bcc
        DelMark         : Enum_DelMark default 0;
        Remarks         : String;
        RowStatus       : String;
        TaskDescription : String null; //Trupti
}

entity MCodeName : managed {
    key CodeUUID    : UUID   @title: 'Unique ID'; // Primary key
        Type        : String @title: 'Type'; // e.g. Raw Material, Finished Good
        Code        : String @title: 'Generated Code'; // e.g. ITM-0001
        Name        : String @title: 'Name'; // e.g. Steel Rod
        Description : String @title: 'Description'; // Optional
        DelMark     : Enum_DelMark default 0;
}


entity DCrfHeader : managed {
    key CrfReqGuid           : UUID;
        CrfReqNo             : Integer64;
        SaveOrSubmit         : Enum_SaveOrSubmit not null;
        ReqTyp               : Enum_RequestType not null;
        OldCrfReqNoGuid      : Association to one DCrfHeader;
        // OldCrfReqNo         : Integer64;
        OldCrfReqNo          : String; //insert in this field Cad Uneeque number
        RefCrfReqNo          : Integer64; //insert in this field Cad Uneeque number
        InputType            : Enum_InputType not null;
        MerReqDate           : Date;
        BuyerCode            : String;
        BuyerName            : String;
        BuyerGuid            : UUID; //Trupti
        Category             : String;
        ItemCode             : String;
        ItemDesc             : String;
        ItemGroup            : String;
        ItemGroupName        : String;
        CrfDelDate           : Date;
        Reamrks              : String;
        ECNNo                : String;
        CarNo                : String;
        CRFNo                : String;
        ProductCatCode       : String;
        ProductCatName       : String;
        SubCatCode           : String;
        SubCatName           : String;
        Length               : Decimal(19, 2);
        TolLength            : Decimal(19, 2);
        Width                : Decimal(19, 2);
        TolWidth             : Decimal(19, 2);
        Height               : Decimal(19, 2);
        TolHeight            : Decimal(19, 2);
        UnitCode             : String;
        UnitName             : String;
        DiaTop               : Decimal(19, 2);
        TolDiaTop            : Decimal(19, 2);
        DiaLeft              : Decimal(19, 2);
        TolDiaLeft           : Decimal(19, 2);
        DiaRight             : Decimal(19, 2);
        TolDiaRight          : Decimal(19, 2);
        DiaBottom            : Decimal(19, 2);
        TolDiaBottom         : Decimal(19, 2);
        CrfStatus            : Enum_CrfStatus not null;
        CrfReqDate           : Date;
        PDDate               : Date;
        PDNo                 : String;
        ApprovalStatus       : Enum_ApprovalStatus not null;
        ApprovalComments     : LargeString;
        newApprovalStatus    : Enum_ApprovalStatus not null;
        newApprovalComment   : LargeString;
        CreatedByUserID      : Association to one MUser;
        CreatedByUserName    : String = CreatedByUserID.UserName;
        Template             : Association to one DTemplate;
        Stage                : Association to one MStage;
        CrfStageCode         : String = Stage.StageCode;
        CrfStageName         : String = Stage.Description;
        appliDiamter         : Enum_YesNo default 'N';
        appliDimension       : Enum_YesNo default 'N';
        InspDraw             : Composition of many CCrfAttachment
                                   on InspDraw.Parent = $self;
        UserAssign           : Composition of many CCrfMeetingDetail
                                   on UserAssign.Parent = $self;
        SeekAdvice           : Composition of many CCrfSeekAdvice
                                   on SeekAdvice.Parent = $self;
        Material             : Composition of many CCrfMaterial
                                   on Material.Parent = $self;
        MaterialComments     : String;
        loginUserID          : Association to one MUser;
        TotalApproved        : Integer default 0;
        TotalRejected        : Integer default 0;
        MMenu                : Association to one MMenu;
        MenuCode             : String = MMenu.MenuCode;
        CrfCategory          : Enum_CrfCategory not null;
        PDDateDate           : Date;
        OldCADUUID           : UUID;
        OldCADNo             : Integer64;
        MCatCode             : String;
        MCatName             : String;
        UOMCode              : String;
        UOMName              : String;
        TimeSlotMinutes      : Int64;
        StartTime            : Time;
        EndTime              : Time;
        EstCostInDocCur      : Decimal(19, 2);
        DocumentCur          : String;
        ExchRate             : Decimal(19, 2);
        BuyerCur             : String;
        EstCostInINR         : Decimal(19, 2);
        //  Brand : Composition of many CCrfBrand on Brand.Parent = $self;
        Team                 : Composition of many CCrfTeam
                                   on Team.Parent = $self;
        Accessibility        : String; //enum table
        ApprovalTransaction  : Composition of many DData
                                   on ApprovalTransaction.ObjectGuid = $self.CrfReqGuid;
        CategoryCode         : String;
        CategoryUniqueNum    : String;
        CADLevel             : Enum_CADLevel;
        DelMark              : Enum_DelMark default 0;
        ProductCatGuid       : Association to one MProductCategory;
        Brand                : Association to CBuyerBrand;
        BrandCode            : String;
        BrandName            : String;
        Diameter             : Decimal(19, 2);
        TolDiameter          : Decimal(19, 2);
        HolderCode           : String;
        HolderName           : String;
        ShapeCode            : String;
        ShapeName            : String;
        CordCode             : String;
        CordName             : String;
        CountryCode          : String;
        CountryDescription   : String;
        ProductSubCat        : Composition of many CCrfProductSubCat
                                   on ProductSubCat.ProductCat = $self;
        OnlycostingRequired  : Boolean default false;

        //sample costing
        CrfApprovalReq       : Enum_YesNo default 'N'; //PDRM meeting required
        ReCostingReq         : Enum_YesNo default 'N'; //Repeat scenario - First stage decision
        CostingType          : Enum_CostingType; //Rendering, CAD, CAD-OnlyCosting, Sample
        PDName               : String;
        ClientSession        : String;
        IsfileuploadOnServer : Enum_YesNo default 'N';
        // For Internal Use - Rishiraj
        FlowName             : String;
        FlowCode             : String;
        MainAttachment       : Composition of one CMainAttachment
                                   on MainAttachment.MainAttachmentGuid = $self.CrfReqGuid;
//

}

entity CMainAttachment : managed {
    key MainAttachmentGuid : UUID not null;
        AttachmentRemarks  : String;
        User               : Association to one MUser;
        Attachment         : Composition of one DAttachment
                                 on Attachment.ReferenceGuid = MainAttachmentGuid;
        Stage              : Association to one MStage;
        StageCode          : String = Stage.StageCode;
        DelMark            : Enum_DelMark default 0;
        Remarks            : String null;
}

//sample costing
type Enum_CostingType       : String enum {
    RENDERING;
    CAD;
    CAD_ONLYCOSTING;
    SAMPLE;
}
//

//
entity CCrfProductSubCat : managed {
    key ProductSubCatGuid : UUID;
        ProductCat        : Association to DCrfHeader;
        SeqId             : Integer default 0;
        Lable             : String;
        Type              : String;
        Value             : String;
        Code              : String;
        Description       : String;
        DelMark           : Enum_DelMark default 0;
}

entity MProductSubCat : managed {
    key ProductSubCatMasterGuid : UUID;
        Name                    : String;
        TypeCode                : String;
        TypeDesc                : String;
        EnumType                : String;
        CountryCode             : String;
        SeqId                   : Integer default 0;
        CountryName             : String;
        Description             : String;
        IsActive                : Enum_YesNo default 'Y';
        DelMark                 : Enum_DelMark default 0;
        Remarks                 : String;
}

entity CCrfAttachment : managed {
    key CrfAttachmentsGuid : UUID;
        Parent             : Association to one DCrfHeader;
        AttachmentRemarks  : String;
        User               : Association to one MUser;
        Attachment         : Composition of many DAttachment
                                 on Attachment.ReferenceGuid = CrfAttachmentsGuid;
        Stage              : Association to one MStage;
        StageCode          : String = Stage.StageCode;
        ApprovalStatus     : Enum_ApprovalStatus default 'NA';
        DelMark            : Enum_DelMark default 0;
        Remarks            : String null;
        RowStatus          : Enum_RowStatus default 'OPEN';
        RowNumber          : Int64 default 1;
}

entity CCrfMeetingDetail : managed {
    key CrfUserAssgGuid   : UUID;
        RowNumber         : Int64;
        DepartmentCode    : String;
        DepartmentName    : String;
        UserID            : Association to one MUser;
        UserCode          : String = UserID.UserCode;
        UserName          : String = UserID.UserName;
        UserEmailId       : String = UserID.EmailId;
        CallMeeting       : Enum_YesNo default 'Y';
        MeetingRemarks    : String;
        IsMeetingAttended : Enum_YesNo;
        Parent            : Association to one DCrfHeader;
        UserAvailable     : String;
        MeetingStartDate  : Timestamp;
        MeetingEndDate    : Timestamp;
        DelMark           : Enum_DelMark default 0;
        Remarks           : String null;
        SendEmail         : Enum_YesNo default 'Y'; //TCM
}

entity CCrfSeekAdvice : managed {
    key CrfSeekAdviceGuid    : UUID;
        RowNumber            : Int64;
        DepartmentCode       : String;
        DepartmentName       : String;
        QuestionToUser       : Association to one MUser;
        QuestionToUserName   : String = QuestionToUser.UserName;
        Role                 : Association to one MRole;
        Question             : String;
        Answer               : String;
        Attachment           : Composition of many DAttachment
                                   on Attachment.ReferenceGuid = CrfSeekAdviceGuid;
        Parent               : Association to one DCrfHeader;
        QuestionFromUser     : Association to one MUser;
        QuestionFromUserName : String = QuestionFromUser.UserName;
        NewAlert             : String;
        DelMark              : Enum_DelMark default 0;
        SendEmailQuestion    : Enum_YesNo default 'Y';
        SendEmailAnswer      : Enum_YesNo default 'N'
}

entity CCrfMaterial : managed {
    key CrfMaterialGuid     : UUID;
        RowNumber           : Int64;
        MaterialAutoCode    : String;
        MaterialCatHanaText : String;
        MaterialCatFreeText : String;
        Parent              : Association to one DCrfHeader;
        UserComments        : LargeString;
        TestProtocol        : String;
        DelMark             : Enum_DelMark default 0;
}

entity CCrfTeam : managed {
    key CrfTeamGuid              : UUID;
        Parent                   : Association to one DCrfHeader;
        User                     : Association to one MUser;
        DelMark                  : Enum_DelMark default 0;
        RoleGuid                 : Association to one MRole;
        RoleCode                 : String = RoleGuid.RoleCode;
        RoleName                 : String = RoleGuid.Description;
        UserName                 : String = User.UserName;
        DepartmentName           : String = User.DepartmentName;
        SubDepartmentName        : String = User.SubDepartmentName;
        DepartmentCode           : String = User.DepartmentCode;
        SubDepartmentCode        : String = User.SubDepartmentCode;
        UserMaterialCategoryCode : String;
        UserMaterialCategoryName : String;
        ProductCategoryCode      : String;
        ProductCategoryName      : String;
        ProductCatGuid           : Association to one MProductCategory;
        RowNumber                : Int64 default 1;
}

entity CCrfBrand : managed {
    key CrfBrandGuid : UUID;
        Parent       : Association to one DCrfHeader;
        BrandCode    : String;
        BrandName    : String;
        DelMark      : Enum_DelMark default 0;

}

entity PrjStatusMaster {
    key prj_id         : UUID;
        prjstatus_code : String(100);
        prjstatus_name : String(100);
}

entity TaskStatusMaster {
    key tsk_id         : UUID;
        tskstatus_code : String(100);
        tskstatus_name : String(100);
}

entity Tactionheader {
    key tah_id              : UUID;
        tah_sono            : String(100);
        tah_no              : Int64;
        tah_lineno          : String(100);
        tah_itemcode        : String(100);
        tah_itemdesc        : String(500);
        tah_prjtemplno      : String(100);
        tah_prjtemplnme     : String(100);
        tah_prjtempdesc     : String(500);
        tah_startdate       : Date;
        tah_prjstatuscode   : String(50);
        tah_prjstatusname   : String(100);
        tah_isactive        : String(100);
        tah_isdeleted       : String(100);
        tah_addbyEmpid      : UUID; // loginuserid
        tah_addbyEmpCode    : String(100); // loginusercode
        tah_addbyUsername   : String(100); // loginusername
        tactiondetail       : Composition of many Tactiondetail
                                  on tactiondetail.tactionheader = $self;
        tah_sodate          : Date;
        tah_sodeldate       : Date;
        tah_soitemcategory  : String(100);
        tah_prjtempcategory : String(100);
        tah_prjtempnoofdays : String(100);
        tah_customercode    : String(100);
        tah_customername    : String(100);
}

entity Tactiondetail {
    key tahd_id                : UUID;
        tahd_depcode           : String(100);
        tahd_depname           : String(100);
        tahd_prjtaskid         : String(100);
        tahd_prjtaskname       : String(100);
        tahd_noofdays          : String(100);
        tahd_days              : String(100);
        tahd_plnstdate         : Date;
        tahd_plneddate         : Date;
        tahd_actstdate         : Date;
        tahd_acteddate         : Date;
        tahd_dldays            : String(100);
        tahd_tskstatuscode     : String(100);
        tahd_tskstatusdesc     : String(100);
        tahd_comments          : String(100);
        DelayByUserRem         : Boolean default true;
        tahd_admincomments     : String(100);
        tactionheader          : Association to one Tactionheader;
        emp_id                 : Association to one MUser;
        emp_code               : String(100);
        emp_name               : String(100);
        tahd_rescostcentercode : String(100);
        tahd_rescostcentername : String(100);
        TaskType               : String(200);
        DocumentType           : String(200);
        APICode                : String(200);
        MaterialGroup          : String(200);
        MaterialCategory       : String(200);
        Operation              : String(200);
        ProductionType         : String(200);
        PlantFrom              : String(200);
        PlantTo                : String(200);
        Sch_ClosureDate        : Timestamp;
        tahd_SortingNumber     : Integer;
}

entity TactionLog {
    key talog_id               : UUID;
        tahd_id                : UUID;
        tahd_depcode           : String(100);
        tahd_depname           : String(100);
        tahd_prjtaskid         : String(100);
        tahd_prjtaskname       : String(100);
        tahd_noofdays          : String(100);
        tahd_days              : String(100);
        tahd_plnstdate         : Date;
        tahd_plneddate         : Date;
        tahd_actstdate         : Date;
        tahd_acteddate         : Date;
        tahd_dldays            : String(100);
        tahd_tskstatuscode     : String(100);
        tahd_tskstatusdesc     : String(100);
        tahd_comments          : String(100);
        tahd_admincomments     : String(100);
        tactionheader          : UUID;
        emp_id                 : UUID;
        emp_code               : String(100);
        emp_name               : String(100);
        tahd_rescostcentercode : String(100);
        tahd_rescostcentername : String(100);
        TaskType               : String(200);
        DocumentType           : String(200);
        APICode                : String(200);
        LoginUserGUID          : UUID;
        LoginUserName          : String;
        LoginUserRole          : String;
        ModificationDate       : DateTime;
}

entity ErrorLog : managed {
    key errGuid       : UUID;
        docHeaderGuid : UUID;
        docHeaderNo   : Int64 null;
        docDetailGuid : UUID null;
        S4API         : String null; //payload
        APICode       : String null;
        errCode       : String;
        errMessage    : String;
        Remarks       : String null;
        MenuName      : String; //CRF/CAD/COSTING/TnA/TnAAutomation
}

entity TNotification : managed {
    key NotificationID      : UUID;
        Menu                : Association to one MMenu;
        MenuDesc            : String = Menu.Description;
        DocumentGUID        : UUID;
        DocumentNo          : Integer;
        // Role                : Association to one MRole;
        User                : Association to one MUser;
        UserName            : String = User.UserName;
        Status              : String;
        NotificatoinMessage : String;
        DateTime            : DateTime;
        Read                : Boolean;
        Clear               : Boolean default false;
        IsActive            : Enum_YesNo default 'Y';
        SubTaskId           : UUID null;
        NotifyFor           : String null; //TNA_ADD,TNA_CLOSE, TNA_DELAY,TNA_NEXT
}

entity MProductCategory : managed {
    key ProductCategoryGuid     : UUID;
        ProductCategoryCode     : String;
        ProductCategoryName     : String;
        DelMark                 : Enum_DelMark default 0;
        Remarks                 : String;
        FirstNum                : String;
        IncrementBy             : Integer64;
        LastNum                 : String;
        Prefix                  : String;
        Suffix                  : String;
        IsActive                : Enum_YesNo default 'Y';
        ProductCategoryCADLevel : Composition of many CProductCategoryCADLevel
                                      on ProductCategoryCADLevel.Parent = $self;
}

entity CProductCategoryCADLevel : managed {
    key ProductCategoryCADLevelGuid : UUID;
        Parent                      : Association to one MProductCategory;
        CADLevelCode                : String;
        CADLevelDescription         : String;
        IncrementBy                 : Int32;
        RowNumber                   : Int64;
        DelMark                     : Enum_DelMark default 0;
}

entity TForgotPassword : managed {
    key ForgotPasswordGUID : UUID;
        Email              : String;
        OTP                : Integer;
}

entity testEmployee {
    key id    : Integer;
        Fname : String null;

}

// CAD Table - Start
// CrfReqUUID.InputType
entity TCadDetail : managed {
        SaveOrSubmit        : Enum_SaveOrSubmit;
        ReqTyp              : String           = CrfReqUUID.ReqTyp;
        // OldCadDetailNoUUID  : UUID; //remove
        // OldCadDetailNo      : Integer64; //remove
    key CadDetailUUID       : UUID;
        CadDetailNo         : Integer64;
        CrfReqUUID          : Association to DCrfHeader;
        OldCrfReqNo         : Integer64        = CrfReqUUID.OldCrfReqNo;
        CrfReqNo            : Integer64        = CrfReqUUID.CrfReqNo;
        // Proflow             : PROCESSFLOW; // remove
        InputType           : Enum_InputType   = CrfReqUUID.InputType;
        MerReqDate          : Date             = CrfReqUUID.MerReqDate;
        BuyerCode           : String           = CrfReqUUID.BuyerCode;
        BuyerName           : String           = CrfReqUUID.BuyerName;
        Category            : String           = CrfReqUUID.Category;
        ItemCode            : String           = CrfReqUUID.ItemCode;
        ItemDesc            : String           = CrfReqUUID.ItemDesc;
        ItemGroup           : String           = CrfReqUUID.ItemGroup;
        ItemGroupName       : String           = CrfReqUUID.ItemGroupName;
        CrfDelDate          : Date             = CrfReqUUID.CrfDelDate;
        Reamrks             : String           = CrfReqUUID.Reamrks;
        ECNNo               : String           = CrfReqUUID.ECNNo;
        CarNo               : String           = CrfReqUUID.CarNo;
        CRFNo               : String           = CrfReqUUID.CRFNo;
        // LblTyp              : LABELTYPE; // remove
        Length              : Decimal(19, 2)   = CrfReqUUID.Length;
        TolLength           : Decimal(19, 2)   = CrfReqUUID.TolLength;
        Width               : Decimal(19, 2)   = CrfReqUUID.Width;
        TolWidth            : Decimal(19, 2)   = CrfReqUUID.TolWidth;
        Height              : Decimal(19, 2)   = CrfReqUUID.Height;
        TolHeight           : Decimal(19, 2)   = CrfReqUUID.TolHeight;
        UnitCode            : String           = CrfReqUUID.UnitCode;
        UnitName            : String           = CrfReqUUID.UnitName;
        DiaTop              : Decimal(19, 2);
        TolDiaTop           : Decimal(19, 2);
        DiaLeft             : Decimal(19, 2);
        TolDiaLeft          : Decimal(19, 2);
        DiaRight            : Decimal(19, 2);
        TolDiaRight         : Decimal(19, 2);
        DiaBottom           : Decimal(19, 2);
        TolDiaBottom        : Decimal(19, 2);
        Diameter            : Decimal(19, 2)   = CrfReqUUID.Diameter;
        TolDiameter         : Decimal(19, 2)   = CrfReqUUID.TolDiameter;
        // CrfStatus           : Enum_CrfStatus; // check
        CadStatus           : Enum_CrfStatus; // New
        CrfReqDate          : Date             = CrfReqUUID.CrfReqDate;
        PDDate              : Date             = CrfReqUUID.PDDate;
        PDNo                : String           = CrfReqUUID.PDNo;
        PDName              : String           = CrfReqUUID.PDName;
        ClientSession       : String           = CrfReqUUID.ClientSession;
        ApprStatus          : Enum_ApprovalStatus;
        ApprComments        : String;
        newApprovalStatus   : Enum_ApprovalStatus;
        newApprovalComment  : String;
        CreatedByUserID     : Association to MUser;
        MMenu               : Association to one MMenu; //new added
        MenuCode            : String           = MMenu.MenuCode; //new added
        Template            : Association to one DTemplate; //new added
        BrandName           : String           = CrfReqUUID.BrandName; //new added
        BuyerCur            : String           = CrfReqUUID.BuyerCur; // new added
        CADLevel            : String           = CrfReqUUID.CADLevel; // new added
        CategoryUniqueNum   : String           = CrfReqUUID.CategoryUniqueNum; // new added
        CountryDescription  : String           = CrfReqUUID.CountryDescription; // new added
        CategoryCode        : String           = CrfReqUUID.CategoryCode; // new added
        EstCostInDocCur     : Decimal(19, 2)   = CrfReqUUID.EstCostInDocCur; // new added
        EstCostInINR        : Decimal(19, 2)   = CrfReqUUID.EstCostInINR; // new added
        ExchRate            : Decimal(19, 2)   = CrfReqUUID.ExchRate; // new added
        SubCatName          : String           = CrfReqUUID.SubCatName; // new added
        ProductCatGuid      : Association to one MProductCategory;
        ProductCatName      : String           = ProductCatGuid.ProductCategoryName;
        ProductCatCode      : String           = ProductCatGuid.ProductCategoryCode;
        // MerTeamHead         : Association to MUser;  // not in use
        // MerTL               : Association to MUser;  // not in use
        // MerATL              : Association to MUser;  // not in use
        // PDCUserId           : Association to MUser;  // not in use
        // TechnoUserId        : Association to MUser;  // not in use
        // QualityTLUserId     : Association to MUser;  // not in use
        // QualityATLUserId    : Association to MUser;  // not in use
        // DesignerUserId      : Association to MUser;  // not in use
        // PendRoleCode        : String; // not in use // remove
        // CrfStageCode        : Association to MStage; // Check
        // CrfStageName        : String           = CrfStageCode.StageCode; // Check
        CadStageCode        : Association to MStage; // Check
        CadStageName        : String           = CadStageCode.StageCode; // Check
        appliDiamter        : Enum_YesNo       = CrfReqUUID.appliDiamter;
        appliDimension      : Enum_YesNo       = CrfReqUUID.appliDimension;
        Team                : Composition of many CCADTeam
                                  on Team.Parent = $self;
        // PDCAttachmentAbsId  : Association to TCadDetailAttachmentDetail; // change by afshan TCrfAttachmentDetail;
        InspDraw            : Composition of many CCADAttachment
                                  on InspDraw.Parent = $self.CadDetailUUID;
        ApprovalTransaction : Composition of many DData
                                  on ApprovalTransaction.ObjectGuid = $self.CadDetailUUID;
        SeekAdvice          : Composition of many CCADSeekAdvice
                                  on SeekAdvice.Parent = $self;
        Material            : Composition of many TCadDetailMaterial
                                  on Material.CadDetailID = $self;
        MaterialComments    : String           = CrfReqUUID.MaterialComments;
        Assembly            : Composition of many TCadAssembly
                                  on Assembly.Parent = $self;
        ImportedAccessory   : Composition of many TCadImportedAccessory
                                  on ImportedAccessory.Parent = $self;
        loginUserID         : Association to MUser;
        TotalApproved       : Integer default 0;
        TotalRejected       : Integer default 0;
        //28112024
        //FormType            : FORMTYPE;
        // FormType            : String; // remove
        MainAssembly        : Composition of many TCadMainAssembly
                                  on MainAssembly.Parent = $self;
        // ChildAssembly       : Composition of many TCadChildAssembly
        //                           on ChildAssembly.TCadDetailID = $self;
        // DTPAssitant         : Association to MUser; // remove
        // DTPHead             : Association to MUser; // remove
        // DTPAssitantName     : String; // remove
        // DTPHeadName         : String; // remove
        CrfCategory         : Enum_CrfCategory = CrfReqUUID.CrfCategory;
        PDDateDate          : Date             = CrfReqUUID.PDDateDate;
        MCatCode            : String           = CrfReqUUID.MCatCode; // for buyer+McatCode filteration
        MCatName            : String           = CrfReqUUID.MCatName;
        // SeasonProgram       : String; // remove
        ProductSubCat       : Composition of many CCADProductSubCat
                                  on ProductSubCat.ProductCat = $self;
        isPattern           : Boolean;
        PackagingType       : String;
        AssembledLocation   : String;
        OnlycostingRequired : Boolean          = CrfReqUUID.OnlycostingRequired;

        //sample costing
        CrfApprovalReq      : Enum_YesNo       = CrfReqUUID.CrfApprovalReq; //PDRM meeting required
        ReCostingReq        : Enum_YesNo       = CrfReqUUID.ReCostingReq; //Repeat scenario - First stage decision
        CostingType         : Enum_CostingType = CrfReqUUID.CostingType; //Rendering, CAD, CAD-OnlyCosting, Sample
        MainAttachment      : Composition of one CMainAttachment
                                  on MainAttachment.MainAttachmentGuid = $self.CadDetailUUID;
//
}

entity CCADProductSubCat : managed {
    key ProductSubCatGuid : UUID;
        ProductCat        : Association to TCadDetail;
        SeqId             : Integer default 0;
        Lable             : String;
        Type              : String;
        Value             : String;
        Code              : String;
        Description       : String;
        DelMark           : Enum_DelMark default 0;
}

entity CCADSeekAdvice : managed {
    key CADSeekAdviceGuid    : UUID;
        RowNumber            : Int64;
        DepartmentCode       : String;
        DepartmentName       : String;
        QuestionToUser       : Association to one MUser;
        QuestionToUserName   : String = QuestionToUser.UserName;
        Role                 : Association to one MRole;
        Question             : String;
        Answer               : String;
        Attachment           : Composition of many DAttachment
                                   on Attachment.ReferenceGuid = CADSeekAdviceGuid;
        Parent               : Association to one TCadDetail;
        QuestionFromUser     : Association to one MUser;
        QuestionFromUserName : String = QuestionFromUser.UserName;
        NewAlert             : String;
        DelMark              : Enum_DelMark default 0;
        SendEmailQuestion    : Enum_YesNo default 'Y';
        SendEmailAnswer      : Enum_YesNo default 'N'
}

// entity TCadDetailSeekAdvice : managed {
//     key SeekAdviceID       : UUID;
//         RowNumber          : Int64;
//         DepartmentCode     : String;
//         DepartmentName     : String;
//         UserID             : Association to MUser;
//         RoleCode           : Association to MRole;
//         Question           : String;
//         Answer             : String;
//         SeekAdviceDocAbsId : Composition of many CCADAttachment
//                                  on  SeekAdviceDocAbsId.Parent    = SeekAdviceID
//                                  and SeekAdviceDocAbsId.ParentRef = 'Seek Advice Attachment';
//         QuestionFrom       : Association to MUser;
//         CadDetailID        : Association to TCadDetail;
//         NewAlert           : String;
// }

// entity TCadDetailInspDrawDetail : managed {
//         CadDetailID          : Association to TCadDetail;
//         // InspRefDocAbsId      : Composition of many CCADAttachment on InspRefDocAbsId.Parent = InspID and InspRefDocAbsId.ParentRef = 'InspDraw';
//         InspRefDocAbsId : Composition of many CCADAttachment
//                               on  InspRefDocAbsId.Parent    = InspID
//                               and InspRefDocAbsId.ParentRef = 'InspDraw';
//         InspRefName          : String;
//         InspRefNo            : String;
//     key InspID               : UUID;
//         RowNumber            : Int64;
//         InspRemarks          : String;
//         DraftUserID          : Association to MUser;
//         // DraftAttachmentAbsId : Association to TCrfAttachmentDetail;
//         DraftRemarks    : String;
//         ApprovalStatus  : Enum_ApprovalStatus;
//         DelMark         : Enum_DelMark default 0;
//         GroupId         : Integer; //* to be incremented for every new set of merchant uploaded drawings

// }


// entity TCadDetailApprovalTransaction : managed {
//     key ApprovalTraID  : UUID;
//         RowNumber      : Int64;
//         ApprovalStatus : Enum_ApprovalStatus;
//         UserId         : Association to MUser;
//         UserCode       : String;
//         RowStatus      : Enum_RowStatus;
//         UserRoleCode   : Association to MRole;
//         RoleName       : String;
//         Comments       : String;
//         StageName      : String;
//         StageCode      : Association to MStage;
//         //28112024
//         //FormType       : FORMTYPE;
//         FormType       : String;
//         ProcessDate    : Timestamp;
//         CadDetailID    : Association to TCadDetail;
//         StartDate      : Timestamp;
//         EndDate        : Timestamp;
//         Type           : String;
//          DelMark         : Enum_DelMark default 0;

// }

entity TCadDetailMaterial : managed {
    key MaterialID          : UUID;
        RowNumber           : Int64;
        MaterialAutoCode    : String;
        MaterialCatHanaText : String;
        MaterialCatFreeText : String;
        Remarks             : String;
        TestProtocol        : String;
        CadDetailID         : Association to TCadDetail;
        IsActive            : Enum_YesNo default 'Y';
        DelMark             : Enum_DelMark default 0;
}

// added by Afshan 0908
entity TCadMainAssembly : managed {
    key MainAssembly     : UUID;
        Parent           : Association to one TCadDetail;
        RowNumber        : Int64;
        ProductNo        : String;
        ProductName      : String;
        Quantity         : Decimal(19, 2);
        QtyUOMCode       : String;
        QtyISOUOMCode    : String;
        QtyUOMName       : String;
        Weight           : Decimal(19, 2);
        WeightUOMCode    : String;
        WeightISOUOMCode : String;
        WeightUOMName    : String;
        PDNumber         : String;
        SCIPLCode        : String;
        Remarks          : String;
        DelMark          : Enum_DelMark default 0;
        ChildAssembly    : Composition of many TCadChildAssembly
                               on ChildAssembly.MainAssembly = $self;

}

entity TCadChildAssembly : managed {
    key ChildAssembly       : UUID;
        RowNumber           : Int64;
        MainAssembly        : Association to one TCadMainAssembly;
        ChildProcess        : Composition of many TCadChildProcess
                                  on ChildProcess.ChildAssembly = $self;
        // ProductNo            : String;
        // ProductName          : String;
        ComponentUOMCode    : String;
        ComponentUOMName    : String; //FT2 or FT3
        ComponentISOUOMCode : String; //SFT or CFT
        Component           : String; // item code
        ComponentName       : String; // item name
        RawMaterialName     : String;
        RawMaterialCode     : String;
        DimensionLength     : Decimal(19, 2);
        DimensionWidth      : Decimal(19, 2);
        DimensionHeight     : Decimal(19, 2);
        Density             : Decimal(19, 2);
        SurfaceArea         : Decimal(19, 2);
        ChildPartWeight     : Decimal(19, 2);
        PurchasePrice       : Decimal(19, 2);
        OHPrice             : Decimal(19, 2); // chnage OHStonePrice - OHPrice
        OHWastePercent      : Decimal(19, 2);
        OHWasteAmount       : Decimal(19, 2);
        ActWastePercent     : Decimal(19, 2);
        ActWasteAmount      : Decimal(19, 2);
        // UOMCodeForProcess    : String;
        // UOMNameForProcess    : String;
        // ISOUOMCodeForProcess : String;
        ComponentQuantity   : Decimal(19, 2);
        RMQuantity          : Decimal(19, 2);
        RMManualQuantity    : Decimal(19, 2);
        Type                : String; // materical Type
        IsParent            : Boolean default true;
        DelMark             : Enum_DelMark default 0;

}

entity TCadAssembly : managed {
    key AssemblyUUID : UUID;
        Parent       : Association to one TCadDetail;
        ItemCode     : String;
        ItemName     : String;
        DelMark      : Enum_DelMark default 0;
        OHAmount     : Decimal(19, 2);
        OHPercent    : Decimal(19, 2);
}

entity TCadImportedAccessory : managed {
    key ImportedAccessoryUUID : UUID;
        Parent                : Association to one TCadDetail;
        ItemCode              : String;
        ItemName              : String;
        Cost                  : Decimal(19, 2);
        ItemDesc              : String;
        DelMark               : Enum_DelMark default 0;
        Qty                   : Decimal(19, 2);
        UnitCost              : Decimal(19, 2); // Unit Price
        UOMCode               : String;
}

entity TCadChildProcess : managed {
    key ProcessUUID        : UUID;
        ProcessName        : String; // Finishing (Text -Box)
        ProcessCode        : String; //FS-001 (Text -Box)
        ProcessDescription : String; // ProcessName + ProcessType
        ProcessType        : String; //Matte (Text -Box)
        UOMCode            : String;
        UOMName            : String;
        ISOUOMCode         : String; // check
        // Process            : Association to one MProcess;
        IsParent           : Boolean default false;
        ChildAssembly      : Association to one TCadChildAssembly;
        DelMark            : Enum_DelMark default 0;
        Details            : Composition of many CCadChildProcessDetails
                                 on Details.Parent = $self;
}

entity CCadChildProcessDetails : managed {
    key ChildProcessDetailUUID : UUID;
        SubProcessName         : String;
        SubProcessCode         : String;
        SubProcessDesc         : String; // SubProcessName +  SubProcessCode
        Voltage                : Decimal(19, 2); //Voltage (in Volts)
        Temperature            : String;
        OverheadPercentage     : Decimal(19, 2);
        WastagePercentage      : Decimal(19, 2);
        UOMCode                : String;
        UOMName                : String;
        ISOUOMCode             : String; // check
        Rate                   : Decimal(19, 2);
        ProcessCost            : Decimal(19, 2);
        Percentage             : Decimal(19, 2);
        ContractorProfit       : Decimal(19, 2);
        Parent                 : Association to one TCadChildProcess;
        DelMark                : Enum_DelMark default 0;
}

entity MProcess : managed {
    key ProcessUUID          : UUID;
        Name                 : String; //Main Process - Machin shop
        Code                 : String; //Specific Code (Unique) - FS-011
        Description          : String; // Code + (Type) - FS-011 (Matte)
        Type                 : String; //Type (Text -Box) - Matte
        MaterialCategoryName : String;
        MaterialCategoryCode : String;
        MaterialCategoryType : String;
        Detail               : Composition of many CProcessDetails
                                   on Detail.Process = $self;
        DelMark              : Enum_DelMark default 0;
        Users                : Association to many XProcessUser
                                   on Users.process = $self;
}

entity CProcessDetails : managed {
    key ProcessDetailsUUID : UUID;
        Name               : String;
        Code               : String;
        CategoryCode       : String;
        CategoryName       : String;
        Voltage            : Decimal(19, 2); //Voltage (in Volts)
        Temprature         : String;
        UOMCode            : String;
        UOMName            : String;
        ISOUOMCode         : String; // check
        Rate               : Decimal(19, 2);
        ProcessCost        : Decimal(19, 2);
        Percentage         : Decimal(19, 2);
        ContractorProfit   : Decimal(19, 2);
        OverheadPercentage : Decimal(19, 2);
        WastagePercentage  : Decimal(19, 2);
        IsAction           : Boolean;
        Process            : Association to one MProcess;
        ProcessCode        : String = Process.Code;
        DelMark            : Enum_DelMark default 0;
}

entity CCADAttachment : managed {
    key CADAttachmentsGuid : UUID;
        // Parent             : Association to one DCrfHeader;
        Parent             : UUID;
        ParentRef          : String;
        AttachmentRemarks  : String;
        User               : Association to one MUser;
        Attachment         : Composition of many DAttachment
                                 on Attachment.ReferenceGuid = CADAttachmentsGuid;
        Stage              : Association to one MStage;
        StageCode          : String = Stage.StageCode;
        ApprovalStatus     : Enum_ApprovalStatus default 'NA';
        Remarks            : String null;
        RowStatus          : Enum_RowStatus default 'OPEN';
        RowNumber          : Int64 default 1;
}

entity CCADTeam : managed {
    key CADTeamGuid              : UUID;
        Parent                   : Association to one TCadDetail;
        User                     : Association to one MUser;
        DelMark                  : Enum_DelMark default 0;
        RoleGuid                 : Association to one MRole;
        RoleCode                 : String = RoleGuid.RoleCode;
        RoleName                 : String = RoleGuid.Description;
        UserName                 : String = User.UserName;
        UserMaterialCategoryCode : String;
        UserMaterialCategoryName : String;
        ProductCategoryCode      : String;
        ProductCategoryName      : String;
        ProductCatGuid           : Association to one MProductCategory;
        RowNumber                : Int64 default 1;
        MenuName                 : String; //           CRF/CAD     Rishiraj
}
// CAD Table - End

//COP Table -start


entity TCostingHeader : managed {
    key CostingHeaderUUID   : UUID;
        CADNo               : Int64;
        CADUUID             : Association to TCadDetail;
        CostingNo           : Integer64;
        FormStatus          : Enum_CrfStatus;
        ItemCode            : String;
        ItemDesc            : String;
        SciplCode           : String;
        SciplDesc           : String;
        CostingVersion      : Integer64 default 1; //
        CostingTypeCode     : String;
        CostingTypeName     : String;
        ProductCatCode      : String;
        ProductCatName      : String;
        CrfReqDate          : Date             = CrfReqUUID.CrfReqDate;
        TolLength           : Decimal(19, 2)   = CrfReqUUID.TolLength;
        TolWidth            : Decimal(19, 2)   = CrfReqUUID.TolWidth;
        TolHeight           : Decimal(19, 2)   = CrfReqUUID.TolHeight;
        DiaTop              : Decimal(19, 2)   = CrfReqUUID.DiaTop;
        TolDiaTop           : Decimal(19, 2)   = CrfReqUUID.TolDiaTop;
        DiaLeft             : Decimal(19, 2)   = CrfReqUUID.DiaLeft;
        TolDiaLeft          : Decimal(19, 2)   = CrfReqUUID.TolDiaLeft;
        DiaRight            : Decimal(19, 2)   = CrfReqUUID.DiaRight;
        TolDiaRight         : Decimal(19, 2)   = CrfReqUUID.TolDiaRight;
        DiaBottom           : Decimal(19, 2)   = CrfReqUUID.DiaBottom;
        TolDiaBottom        : Decimal(19, 2)   = CrfReqUUID.TolDiaBottom;
        TolDiameter         : Decimal(19, 2)   = CrfReqUUID.TolDiameter;
        Diameter            : Decimal(19, 2)   = CrfReqUUID.Diameter;
        CrfCategory         : Enum_CrfCategory = CrfReqUUID.CrfCategory;
        InputType           : Enum_InputType   = CrfReqUUID.InputType;
        //
        // Diameter            : Decimal(19, 2);
        Length              : Decimal(19, 2);
        Width               : Decimal(19, 2);
        Height              : Decimal(19, 2);
        Unit                : String; /* Need to get more clarity */
        UnitCode            : String; /* Need to get more clarity */
        UnitName            : String; /* Need to get more clarity */
        Weight              : Decimal(19, 2);
        SeekAdvice          : Composition of many CCostingSeekAdvice
                                  on SeekAdvice.Parent = $self;
        CostingDate         : Date;
        CostingDoneDate     : Date;
        BuyerCode           : String;
        BuyerName           : String;
        ApprStatus          : Enum_ApprovalStatus;
        SaveOrSubmit        : Enum_SaveOrSubmit;
        newApprovalStatus   : Enum_ApprovalStatus;
        newApprovalComment  : String;
        CreatedByUserID     : Association to MUser;
        CostingStageCode    : Association to MStage;
        CostingStageName    : String;
        loginUserID         : Association to MUser;
        TotalApproved       : Integer default 0;
        TotalRejected       : Integer default 0;
        FormType            : String;
        ReqTyp              : Enum_RequestType;
        ApprComments        : String;
        ProductCategory     : String;
        InspDraw            : Composition of many CCostingAttachment
                                  on InspDraw.Parent = $self;
        ApprovalTransaction : Composition of many DData
                                  on ApprovalTransaction.ObjectGuid = $self.CostingHeaderUUID;
        /**     new fields  start for COP comes from CAD */
        CrfReqUUID          : Association to DCrfHeader;
        CrfReqNo            : Integer64;
        PDDate              : Date;
        PDNo                : String;
        appliDiamter        : Enum_YesNo default 'N';
        appliDimension      : Enum_YesNo default 'N';
        CADLevel            : String;
        SubCatName          : String;
        MCatCode            : String; // Code of Stone+matel+wood
        MCatName            : String; // Stone+matel+wood
        MerReqDate          : Date;
        BrandName           : String;
        CategoryCode        : String;
        CategoryUniqueNum   : String;
        OldCrfReqNo         : String;
        OldCadDetailNo      : Integer64;
        EstCostInDocCur     : Decimal(19, 2);
        EstCostInINR        : Decimal(19, 2);
        BuyerCur            : String;
        ExchRate            : Decimal(19, 2);
        CrfDelDate          : Date;
        Reamrks             : String;
        CarNo               : String;
        ECNNo               : String;
        MaterialCategory    : Composition of many CCostingMaterialCategory
                                  on MaterialCategory.Parent = $self;
        Team                : Composition of many CCostingTeam
                                  on Team.Parent = $self;
        MMenu               : Association to one MMenu;
        MenuCode            : String           = MMenu.MenuCode;
        Template            : Association to one DTemplate;
        Stage               : Association to one MStage;
        CopStageCode        : String           = Stage.StageCode;
        CopStageName        : String           = Stage.Description;
        // SECTION MAPPING CATEGORY WISE
        MainAssembly        : Composition of CCostingMainAssembly;
        Stone               : Composition of CCostingStone;
        Metal               : Composition of CCostingMetal;
        Wood                : Composition of CCostingWood;
        Other               : Composition of CCostingOtherMaterial;
        Packaging           : Composition of CCostingPackaging;
        ExtraCharges        : Composition of CCostingExtraCharges;
        Accessories         : Composition of CCostingAccessories;
        Assembly            : Composition of many CCostingAssembly
                                  on Assembly.Parent = $self;
        ImportedAccessory   : Composition of many CCostingImportedAccessory
                                  on ImportedAccessory.Parent = $self;
        // FOR GETTING MATERIAL CATEGORY
        MaterialDetails     : Composition of many CCostingMaterialDetails
                                  on MaterialDetails.Parent = $self;
        isPattern           : Boolean;
        PackagingType       : String;
        AssembledLocation   : String;
        OnlycostingRequired : Boolean          = CrfReqUUID.OnlycostingRequired;

        //sample costing
        CrfApprovalReq      : Enum_YesNo       = CrfReqUUID.CrfApprovalReq; //PDRM meeting required
        ReCostingReq        : Enum_YesNo       = CrfReqUUID.ReCostingReq; //Repeat scenario - First stage decision
        // CostingType         : Enum_CostingType = CrfReqUUID.CostingType; //Rendering, CAD, CAD-OnlyCosting, Sample
        CostingType         : String(100); //Sales order number
        SONo                : String(100); //Sales order number
        SOLineNo            : String(100); //Sales order LineNo
        Plant               : String(100); //Plant name
        PlantCode           : String(100); //Plant Code
        ProdReceiptNo       : String(100); //Receipt from Production Number
        FGCode              : String(100); //FGCode
        ProceedWithSampling : Enum_YesNo default 'N';
        RefCrfReqNo         : Integer64        = CrfReqUUID.RefCrfReqNo;
        RefCostingNo        : Integer64;
        PDName              : String           = CrfReqUUID.PDName;
        ClientSession       : String           = CrfReqUUID.ClientSession;
        MainAttachment      : Composition of one CMainAttachment
                                  on MainAttachment.MainAttachmentGuid = $self.CostingHeaderUUID;
//

}

entity CCostingMainAssembly : managed {
    key CostingMainAssemblyUUID : UUID;
        Parent                  : Association to one TCostingHeader;
        RowNumber               : Int64;
        ProductNo               : String;
        ProductName             : String;
        Quantity                : Decimal(19, 2);
        QtyUOMCode              : String;
        QtyISOUOMCode           : String;
        QtyUOMName              : String;
        Weight                  : Decimal(19, 2);
        WeightUOMCode           : String;
        WeightISOUOMCode        : String;
        WeightUOMName           : String;
        MenualWeight            : Decimal(19, 2);
        MenualWeightUOMCode     : String;
        MenualWeightISOUOMCode  : String;
        MenualWeightUOMName     : String;
        PDNumber                : String;
        SCIPLCode               : String;
        Remarks                 : String;
        DelMark                 : Enum_DelMark default 0;


}

entity CCostingStone : managed {
    key CostingStoneUUID               : UUID;
        StoneSumUnitcost               : Decimal(19, 2);
        StoneSumActWastageAmt          : Decimal(19, 2);
        StoneTotalActCost              : Decimal(19, 2);
        StoneSumOHCost                 : Decimal(19, 2);
        StoneSumOHWastageAmount        : Decimal(19, 2);
        StoneTotalCostBaseStone        : Decimal(19, 2);
        StoneLocalHandlingPer          : Decimal(19, 2);
        StoneLocalHandlingAmount       : Decimal(19, 2);
        StoneFactoryOverHeadPercentage : Decimal(19, 2);
        StoneFactoryOverHead           : Decimal(19, 2);
        TotalOfProcessCost             : Decimal(19, 2); // Total of All Process Cost
        TotalOfProcessWastageCost      : Decimal(19, 2); // Total of All Process Wastage Cost
        TotalCostOfItemProcess         : Decimal(19, 2); // Total of All Cost Of Item Process
        CostingActualCostDetails       : Composition of many CCostingActualCostDetail //
                                             on CostingActualCostDetails.Parent = $self.CostingStoneUUID;
//   on CostingStoneProcessDetail.CostingStoneID = $self;
}

entity CCostingOtherMaterial : managed {
    key CostingOtherMaterialUUID                : UUID;
        OtherMaterialSumUnitcost                : Decimal(19, 2);
        OtherMaterialSumActWastageAmt           : Decimal(19, 2);
        OtherMaterialTotalActCost               : Decimal(19, 2);
        OtherMaterialSumOHCost                  : Decimal(19, 2);
        OtherMaterialSumOHWastageAmount         : Decimal(19, 2);
        OtherMaterialTotalCostBaseOtherMaterial : Decimal(19, 2);
        OtherMaterialFactoryOverHeadPercentage  : Decimal(19, 2);
        OtherMaterialFactoryOverHead            : Decimal(19, 2);
        TotalOfProcessCost                      : Decimal(19, 2); // Total of All Process Cost
        TotalOfProcessWastageCost               : Decimal(19, 2); // Total of All Process Wastage Cost
        TotalCostOfItemProcess                  : Decimal(19, 2); // Total of All Cost Of Item Process
        OtherMaterialLocalHandlingPer           : Decimal(19, 2);
        OtherMaterialLocalHandlingAmount        : Decimal(19, 2);
        CostingActualCostDetails                : Composition of many CCostingActualCostDetail //
                                                      on CostingActualCostDetails.Parent = $self.CostingOtherMaterialUUID;
}

entity CCostingActualCostDetail : managed {
    key CostingActCostDetailUUID : UUID;
        RowNumber                : Int64;
        Parent                   : UUID; //Association to CCostingStone; // check
        // type                    : String; // for Material
        ItemCode                 : String; //"Item Code  SAP Child part Code"
        ItemDesc                 : String; // "Item Code / Name(Child Part)"
        MaterialCategoryCode     : String; //MaterialCategory
        MaterialCategoryName     : String; //MaterialCategory
        MaterialCategoryType     : String; //MaterialCategory
        RawMaterialName          : String; // Raw Material Name
        RawMaterialCode          : String; // Raw Material Code
        DimensionLength          : Decimal(19, 2);
        DimensionWidth           : Decimal(19, 2);
        DimensionHeight          : Decimal(19, 2);
        SurfaceArea              : Decimal(19, 2);
        ChildPartWeight          : Decimal(19, 2); // defoult in KG
        ChildPartWeightManual    : Decimal(19, 2); // defoult in KG

        // Dimension                     : Decimal(19, 2);   // not required
        FinishCode               : String;
        FinishName               : String; //Finish Name
        Percentage               : Decimal(19, 2); // change StonePer - Percentage
        RawMaterialQuantity      : Decimal(19, 2); // Raw Material Qty
        ManualQuantity           : Decimal(19, 2); // for user input RM Qty
        RMUOMCode                : String;
        RMUOMName                : String;
        RMISOUOMCode             : String;

        PurchasePrice            : Decimal(19, 2);
        ManualPrice              : Decimal(19, 2); // Manual Price
        ActualUnitCost           : Decimal(19, 2); // change ActualStoneUnitCost - ActualUnitCost
        ActWastePercent          : Decimal(19, 2);
        ActWasteAmount           : Decimal(19, 2);
        Density                  : Decimal(19, 2);
        UOM                      : String;
        // SurfaceArea                   : Decimal(19, 2);
        // Micron                        : Decimal(19, 2);
        // DFT                           : Decimal(19, 2);
        Finish                   : String;
        // GrossWeight                   : Decimal(19, 2);
        // GrossQty                      : Decimal(19, 2);
        // GrossQtyUom                   : Decimal(19, 2);
        OHPrice                  : Decimal(19, 2); // chnage OHStonePrice - OHPrice
        OHUnitCost               : Decimal(19, 2); //change OHStoneUnitCost - OHUnitCost
        OHWastePercent           : Decimal(19, 2);
        OHWasteAmount            : Decimal(19, 2);
        CostingProcess           : Composition of many CCostingProcess //
                                       on CostingProcess.Parent = $self.CostingActCostDetailUUID;
}

entity CCostingProcess : managed {
    key CostingProcessUUID       : UUID;
        ItemCode                 : String; // from parent
        RowNumber                : Int64;
        Parent                   : UUID; //Association to TCostingStoneActualCostDetail;
        ProcessType              : String;
        ProcessName              : String;
        ProcessCode              : String;
        ProcessDescription       : String;
        AssetCode                : String; // "Asset Code( SAP )" - From SAP
        AssetDesc                : String;
        SAPProcessCost           : Decimal(19, 2); // map from SAP p_product_cost in External BOM API
        TotalProcessCost         : Decimal(19, 2); // sum of all Sub process Cost
        TotalTime                : Decimal(19, 2);
        TotalProcessWastageCost  : Decimal(19, 2); // Sum of All Sub Process Wasetage Cost
        TotalProcessOverheadCost : Decimal(19, 2); // Sum of All Sub Process OH Cost  need to add Rishiraj
        TotalCost                : Decimal(19, 2); // Sum of TotalProcessCost + TotalProcessWastageCost
        // InputMethod                   : String;
        // Time                          : Time;
        // WastageProcessPercent         : Decimal(19, 2);
        // ProcessWastageCost            : Decimal(19, 2);
        // ProcessJWRate                 : Decimal(19, 2);
        // ProcessTime                   : Time;
        // WastageProcessPer             : Decimal(19, 2);
        CostingProcessDetail     : Composition of many CCostingProcessDetails
                                       on CostingProcessDetail.Parent = $self.CostingProcessUUID
}

entity CCostingProcessDetails : managed {
    key CostingProcessDetailUUID         : UUID;
        ItemCode                         : String;
        RowNumber                        : Int64;
        Parent                           : UUID; //Association to TCostingStoneActualCostDetail;
        SubProcessName                   : String;
        SubProcessCode                   : String;
        SubProcessDesc                   : String; // SubProcessName +  SubProcessCode
        Voltage                          : Decimal(19, 2); //Voltage (in Volts)
        Temperature                      : String;
        UOMCode                          : String;
        UOMName                          : String;
        ISOUOMCode                       : String; // check
        Quantity                         : Decimal(19, 2);
        Time                             : Decimal(19, 2);
        Rate                             : Decimal(19, 2);
        Percentage                       : Decimal(19, 2);
        ProcessCost                      : Decimal(19, 2);
        ManualCost                       : Decimal(19, 2);

        ContractorProfit                 : Decimal(19, 2);
        Category                         : String;
        OverheadPercentage               : Decimal(19, 2);
        WastagePercentage                : Decimal(19, 2);
        OverheadCost                     : Decimal(19, 2);
        WastageCost                      : Decimal(19, 2);


        ProcessType                      : String;
        InputMethod                      : String;
        SubProcessTotalCost              : Decimal(19, 2);
        SubProcessTotalCostIncAllProcess : Decimal(19, 2);


// ProcessWastagePercent         : Decimal(19, 2);
// ProcessWastageCost            : Decimal(19, 2);
// ProcessJWRate                 : Decimal(19, 2);
// ProcessTime                   : Time;
// WastageProcessPer             : Decimal(19, 2);
}


entity CCostingWood : managed {
    key CostingWoodUUID               : UUID;
        //Wood Actual , Base, Local
        WoodSumUnitcost               : Decimal(19, 2);
        WoodSumActWastageAmt          : Decimal(19, 2);
        WoodTotalActCost              : Decimal(19, 2);
        WoodSumOHCost                 : Decimal(19, 2);
        WoodSumOHWastageAmount        : Decimal(19, 2);
        WoodTotalCostBaseWood         : Decimal(19, 2);
        WoodFactoryOverHeadPercentage : Decimal(19, 2);
        WoodFactoryOverHead           : Decimal(19, 2);
        TotalOfProcessCost            : Decimal(19, 2); // Total of All Process Cost
        TotalOfProcessWastageCost     : Decimal(19, 2); // Total of All Process Wastage Cost
        TotalCostOfItemProcess        : Decimal(19, 2); // Total of All Cost Of Item Process
        // //Wood Local
        WoodLocalHandlingPer          : Decimal(19, 2);
        WoodLocalHandlingAmount       : Decimal(19, 2);
        // //Wood Process
        // WoodSumProcessCost        : Decimal(19, 2);
        // WoodTotalTime             : Time;
        // WoodSumProcessWastageCost : Decimal(19, 2);
        CostingActualCostDetails      : Composition of many CCostingActualCostDetail //
                                            on CostingActualCostDetails.Parent = $self.CostingWoodUUID;
// CostingWoodBaseCostDetail    : Composition of many TCostingWoodBaseCostDetail //
//                                    on CostingWoodBaseCostDetail.CostingWoodID = $self;
// CostingWoodProcessDetail     : Composition of many TCostingWoodProcessDetail //
//                                 on CostingWoodProcessDetail.CostingWoodID = $self;
}

entity CCostingMetal : managed {
    key CostingMetalUUID               : UUID;
        // //Metal Actual , Base, Local
        MetalSumUnitcost               : Decimal(19, 2);
        MetalSumActWastageAmt          : Decimal(19, 2);
        MetalTotalActCost              : Decimal(19, 2);
        MetalSumOHCost                 : Decimal(19, 2);
        MetalSumOHWastageAmount        : Decimal(19, 2);
        MetalTotalCostBaseMetal        : Decimal(19, 2);
        MetalFactoryOverHeadPercentage : Decimal(19, 2);
        MetalFactoryOverHead           : Decimal(19, 2);
        TotalOfProcessCost             : Decimal(19, 2); // Total of All Process Cost
        TotalOfProcessWastageCost      : Decimal(19, 2); // Total of All Process Wastage Cost
        TotalCostOfItemProcess         : Decimal(19, 2); // Total of All Cost Of Item Process
        // //Metal Local
        MetalLocalHandlingPer          : Decimal(19, 2);
        MetalLocalHandlingAmount       : Decimal(19, 2);
        // //Metal Process
        // MetalSumProcessCost        : Decimal(19, 2);
        // MetalTotalTime             : Time;
        // MetalSumProcessWastageCost : Decimal(19, 2);
        CostingActualCostDetails       : Composition of many CCostingActualCostDetail //
                                             on CostingActualCostDetails.Parent = $self.CostingMetalUUID;
// CostingMetalBaseCostDetail   : Composition of many TCostingMetalBaseCostDetail //
//                                    on CostingMetalBaseCostDetail.CostingMetalID = $self;
// CostingMetalProcessDetail    : Composition of many TCostingMetalProcessDetail //
//                                    on CostingMetalProcessDetail.CostingMetalID = $self;
}

entity CCostingAccessories : managed {
    key CostingAccessoriesUUID      : UUID;
        TotalAccessoriesCost        : Decimal(19, 2);
        TotalAccessoriesWastageCost : Decimal(19, 2);
        TotalCost                   : Decimal(19, 2); // TotalAccessoriesCost + TotalAccessoriesWastageCost
        CostingAccessory            : Composition of many CCostingAccessoriesDetails //
                                          on CostingAccessory.CostingAccessoriesID = $self;
}

entity CCostingPackaging : managed {
    key CostingPackagingUUID : UUID;
        CostingPackaging     : Composition of many CCostingPackingDetails //
                                   on CostingPackaging.CostingPackagingID = $self;
}

entity CCostingExtraCharges : managed {
    key CostingExtraChargesUUID : UUID;
        CostingExtraCharges     : Composition of many CCostingExtraChargesDetails //
                                      on CostingExtraCharges.CostingExtraChargesID = $self;
}

entity CCostingMaterialDetails : managed {
    key CopMaterialGuid      : UUID;
        Parent               : Association to one TCostingHeader; // header reference
        MaterialCategoryCode : String;
        MaterialCategoryName : String;

        //Trupti 29062025
        MaterialCategoryType : String;
}

entity CCostingTeam : managed {
    key CostingTeamGuid          : UUID;
        Parent                   : Association to one TCostingHeader;
        User                     : Association to one MUser;
        DelMark                  : Enum_DelMark default 0;
        RoleGuid                 : Association to one MRole;
        RoleCode                 : String = RoleGuid.RoleCode;
        RoleName                 : String = RoleGuid.Description;
        UserName                 : String = User.UserName;
        DepartmentName           : String = User.DepartmentName;
        SubDepartmentName        : String = User.SubDepartmentName;
        DepartmentCode           : String = User.DepartmentCode;
        SubDepartmentCode        : String = User.SubDepartmentCode;
        UserMaterialCategoryCode : String;
        UserMaterialCategoryName : String;
        UserMaterialCategoryType : String;
        ProductCategoryCode      : String;
        ProductCategoryName      : String;
        ProductCatGuid           : Association to one MProductCategory;
        RowNumber                : Int64 default 1;
        MenuName                 : String; //           CRF/CAD/COP
}

entity CCostingSeekAdvice : managed {
    key CostingSeekAdviceGuid : UUID;
        RowNumber             : Int64;
        DepartmentCode        : String;
        DepartmentName        : String;
        QuestionToUser        : Association to one MUser;
        QuestionToUserName    : String = QuestionToUser.UserName;
        Role                  : Association to one MRole;
        Question              : String;
        Answer                : String;
        Attachment            : Composition of many DAttachment
                                    on Attachment.ReferenceGuid = CostingSeekAdviceGuid;
        Parent                : Association to one TCostingHeader;
        QuestionFromUser      : Association to one MUser;
        QuestionFromUserName  : String = QuestionFromUser.UserName;
        NewAlert              : String;
        DelMark               : Enum_DelMark default 0;
        SendEmailQuestion     : Enum_YesNo default 'Y';
        SendEmailAnswer       : Enum_YesNo default 'N'
}

entity CCostingAttachment : managed {
    key CostingAttachmentsGuid : UUID;
        Parent                 : Association to one TCostingHeader;
        AttachmentRemarks      : String;
        User                   : Association to one MUser;
        Attachment             : Composition of many DAttachment
                                     on Attachment.ReferenceGuid = CostingAttachmentsGuid;
        Stage                  : Association to one MStage;
        StageCode              : String = Stage.StageCode;
        ApprovalStatus         : Enum_ApprovalStatus default 'NA';
        DelMark                : Enum_DelMark default 0;
        Remarks                : String null;
        RowStatus              : Enum_RowStatus default 'OPEN';
        RowNumber              : Int64 default 1;
}

entity CCostingMaterialCategory : managed {
    key CostingMaterialCategoryGuid : UUID;
        Parent                      : Association to one TCostingHeader;
        MaterialCategoryCode        : String;
        MaterialCategoryName        : String;
        MaterialCatFreeText         : String;
        RowNumber                   : Int64;
        TestProtocol                : String;
        DelMark                     : Enum_DelMark default 0;
        Remarks                     : String;

}

entity CCostingAccessoriesDetails : managed {
    key CostingAccessoriesUUID     : UUID;
        CostingAccessoriesID       : Association to CCostingAccessories;
        ItemCode                   : String;
        ItemName                   : String;
        Dimension                  : String; //
        Qty                        : Decimal(19, 2);
        MinOrderQty                : Integer;
        UOMCode                    : String; //
        UOMName                    : String; //
        UnitPrice                  : Decimal(19, 2);
        UnitCost                   : Decimal(19, 2);
        ProductPercent             : Decimal(19, 2);
        JobWorkChargeFirst         : Decimal(19, 2);
        JobWorkChargeSecond        : Decimal(19, 2);
        JobWorkChargeThird         : Decimal(19, 2);
        AssemblyFittingCharges     : Decimal(19, 2);
        TotalCharges               : Decimal(19, 2);
        OverHeadPercent            : Decimal(19, 2);
        OHAmount                   : Decimal(19, 2);
        WastagePercent             : Decimal(19, 2);
        WastageCost                : Decimal(19, 2);
        TotalCostIncludeAllProcess : Decimal(19, 2);
        MaterialCategoryType       : String;
        TargetCost                 : Decimal(19, 2)
}

entity CCostingAssembly : managed {
    key CostingAssemblyUUID   : UUID;
        Parent                : Association to TCostingHeader;
        ItemCode              : String;
        ItemName              : String;
        Qty                   : Decimal(19, 2);
        Category              : String;
        UOMCode               : String;
        UOMName               : String;
        ISOUOMCode            : String; // check
        Price                 : Decimal(19, 2);
        TotalCost             : Decimal(19, 2);
        TotalCostIncAllCharge : Decimal(19, 2); //  Need to add -Rishiraj
        OHAmount              : Decimal(19, 2);
        OHPercent             : Decimal(19, 2);
        WastagePercent        : Decimal(19, 2);
        WastageAmount         : Decimal(19, 2);
}

entity CCostingImportedAccessory : managed {
    key CostingImportedAccessoryUUID : UUID;
        Parent                       : Association to TCostingHeader;
        ItemName                     : String;
        ItemCode                     : String;
        Qty                          : Decimal(19, 2);
        UnitCost                     : Decimal(19, 2); // Unit Price
        UOMCode                      : String;
        UOMName                      : String;
        Cost                         : Decimal(19, 2); // Total Cost Qty x UnitCost
        ItemDesc                     : String;
}

entity CCostingExtraChargesDetails : managed {
    key CostingExtraChargesUUID       : UUID;
        CostingExtraChargesID         : Association to CCostingExtraCharges;
        Curreny                       : String;
        TotalCost                     : Decimal(19, 2);
        ExchangeRate                  : Decimal(19, 2);
        //PriceInUSDollar     : Decimal(19, 2);
        //    DerivedInterPrice       : Decimal(19, 2);
        PriceCurrency                 : String;
        PriceInCurrency               : Decimal(19, 2); // need to add - Rishiraj
        ShippingCost                  : Decimal(19, 2);
        TestingChargeNOS              : Decimal(19, 2); // No Of Sample
        TestingChargeTotalCost        : Decimal(19, 2);
        TestingChargePrice            : Decimal(19, 2);
        TestingChargeMOQ              : Integer;

        LabellingCharge               : Decimal(19, 2); // not in use
        TrimmingCost                  : Decimal(19, 2);
        TrimmingCostName              : String;
        PriceIncAlCharges             : Decimal(19, 2);
        Profit                        : Decimal(19, 2);
        ProfitPercentage              : Decimal(19, 2); // need to add - Rishiraj
        // ExtraWEIGHT             : Decimal(19, 2);
        // ExtraWEIGHTUoM          : String;
        // ExtraRemarks            : String;
        Remarks                       : String;
        TotalOHCost                   : Decimal(19, 2);
        POPMOQ                        : Decimal(19, 2); // Pre Production photoshoot Minimum Order Quentity
        POPNoOfSample                 : Integer;
        POPCharges                    : Decimal(19, 2);
        POPCost                       : Decimal(19, 2);
        OHPercent                     : Decimal(19, 2);
        OHCost                        : Decimal(19, 2);
        PriceIncAlChargesINR          : Decimal(18, 2);
        ProfitMargin                  : Decimal(5, 2);
        TotalMarginAsPerOrderQty      : Decimal(18, 2);
        TotalOHAsPerQty               : Decimal(18, 2);
        TotalMarginAsPerCumulativeQty : Decimal(18, 2);
        TotalOHAsPerCumulativeQty     : Decimal(18, 2);

}

entity TCostingApprovalTransaction : managed {
    key CostingApprovalTraID : UUID;
        RowNumber            : Int64;
        CostingHeaderID      : Association to TCostingHeader;
        ApprovalStatus       : Enum_ApprovalStatus;
        UserId               : Association to MUser;
        UserCode             : String;
        RowStatus            : Enum_RowStatus;
        UserRoleId           : Association to MRole;
        RoleName             : String;
        Comments             : String;
        StageName            : String;
        StageCode            : Association to MStage;
        //28112024
        //FormType             : FORMTYPE;
        FormType             : String;
        StartDate            : Timestamp;
        EndDate              : Timestamp;
        Type                 : String
}


// entity TCostingSeekAdvice : managed {
//     key CostingSeekAdviceID : UUID;
//         RowNumber           : Int64;
//         CostingHeaderID     : Association to TCostingHeader;
//         DepartmentCode      : String;
//         DepartmentName      : String;
//         UserID              : Association to MUser; //* Questions being asked TO this User
//         RoleID              : Association to MRole;
//         Question            : String;
//         Answer              : String;
//         SeekAdviceDocAbsId  : Association to TCostingAttachmentDetail;
//         QuestionFrom        : Association to MUser; //* new
//         NewAlert            : String;
// }


//generic attachment details table
// entity TCostingAttachmentDetail : managed {
//     key AbsId          : UUID;
//         RowNumber      : Int64;
//         AttachPath     : String;
//         ActualFileName : String;
//         DisplayName    : String;
//         FileExtension  : String;
//         SeekAdvice     : Association to TCostingSeekAdvice;
// }

entity CCostingPackingDetails : managed {
    key CostingPackingDetailsID : UUID;
        CostingPackagingID      : Association to CCostingPackaging;
        // PackagingJobWork    : Integer;
        PackagingJobWorkCost    : Decimal(19, 2);
        PackingCost             : Decimal(19, 2);
        TotalPackingCost        : Decimal(19, 2); // PackagingJobWorkCost + PackingCost
        TrimCost                : Decimal(19, 2);
        TrimName                : String;
        InnerBoxL               : Decimal(19, 2);
        InnerBoxW               : Decimal(19, 2);
        InnerBoxH               : Decimal(19, 2);
        InnerBoxUOM             : String;
        MasterCartoonL          : Decimal(19, 2);
        MasterCartoonW          : Decimal(19, 2);
        MasterCartoonH          : Decimal(19, 2);
        MasterCartoonUOM        : String;
        BrandPackingCost        : Decimal(19, 2);
        BrandPackingName        : String;
        LabellingCharge         : Decimal(19, 2);
        CasePack                : Decimal(19, 2); /* Need to get more clarity */
        CBM                     : Decimal(19, 2);
        CostPerCBM              : Decimal(19, 2);
        Overhead                : Decimal(19, 2);
        OverheadPercentage      : Decimal(19, 2);
        TargetPackingCost       : Decimal(19, 2)
}

entity TSalesCostingHeader : managed {
    key SalesCostingHeaderUUID : UUID;
        CADNo                  : Int64;
        CADUUID                : Association to TCadDetail;
        CostingNo              : Integer64;
        FormStatus             : Enum_CrfStatus;
        ItemCode               : String;
        ItemDesc               : String;
        SciplCode              : String;
        SciplDesc              : String;
        CostingVersion         : Integer64 default 1; //
        CostingTypeCode        : String;
        CostingTypeName        : String;
        ProductCatCode         : String;
        ProductCatName         : String;
        CrfReqDate             : Date             = CrfReqUUID.CrfReqDate;
        TolLength              : Decimal(19, 2)   = CrfReqUUID.TolLength;
        TolWidth               : Decimal(19, 2)   = CrfReqUUID.TolWidth;
        TolHeight              : Decimal(19, 2)   = CrfReqUUID.TolHeight;
        DiaTop                 : Decimal(19, 2)   = CrfReqUUID.DiaTop;
        TolDiaTop              : Decimal(19, 2)   = CrfReqUUID.TolDiaTop;
        DiaLeft                : Decimal(19, 2)   = CrfReqUUID.DiaLeft;
        TolDiaLeft             : Decimal(19, 2)   = CrfReqUUID.TolDiaLeft;
        DiaRight               : Decimal(19, 2)   = CrfReqUUID.DiaRight;
        TolDiaRight            : Decimal(19, 2)   = CrfReqUUID.TolDiaRight;
        DiaBottom              : Decimal(19, 2)   = CrfReqUUID.DiaBottom;
        TolDiaBottom           : Decimal(19, 2)   = CrfReqUUID.TolDiaBottom;
        TolDiameter            : Decimal(19, 2)   = CrfReqUUID.TolDiameter;
        Diameter               : Decimal(19, 2)   = CrfReqUUID.Diameter;
        CrfCategory            : Enum_CrfCategory = CrfReqUUID.CrfCategory;
        InputType              : Enum_InputType   = CrfReqUUID.InputType;
        PDNo                   : String;
        PDName                 : String;
        ClientSession          : String;
        //
        // Diameter            : Decimal(19, 2);
        Length                 : Decimal(19, 2);
        Width                  : Decimal(19, 2);
        Height                 : Decimal(19, 2);
        Unit                   : String; /* Need to get more clarity */
        UnitCode               : String; /* Need to get more clarity */
        UnitName               : String; /* Need to get more clarity */
        Weight                 : Decimal(19, 2);
        SeekAdvice             : Composition of many CSeekAdviceCommon
                                     on SeekAdvice.Parent = $self.SalesCostingHeaderUUID;
        CostingDate            : Date;
        CostingDoneDate        : Date;
        BuyerCode              : String;
        BuyerName              : String;
        ApprStatus             : Enum_ApprovalStatus;
        SaveOrSubmit           : Enum_SaveOrSubmit;
        newApprovalStatus      : Enum_ApprovalStatus;
        newApprovalComment     : String;
        CreatedByUserID        : Association to MUser;
        CostingStageCode       : Association to MStage;
        CostingStageName       : String;
        loginUserID            : Association to MUser;
        TotalApproved          : Integer default 0;
        TotalRejected          : Integer default 0;
        FormType               : String;
        ReqTyp                 : Enum_RequestType;
        ApprComments           : String;
        ProductCategory        : String;
        InspDraw               : Composition of many CAttachmentCommon
                                     on InspDraw.Parent = $self.SalesCostingHeaderUUID;
        ApprovalTransaction    : Composition of many DData
                                     on ApprovalTransaction.ObjectGuid = $self.SalesCostingHeaderUUID;
        /**     new fields  start for COP comes from CAD */
        CrfReqUUID             : Association to DCrfHeader;
        CrfReqNo               : Integer64;
        PDDate                 : Date;
        // PDNo                   : String;
        appliDiamter           : Enum_YesNo default 'N';
        appliDimension         : Enum_YesNo default 'N';
        CADLevel               : String;
        SubCatName             : String;
        MCatCode               : String; // Code of Stone+matel+wood
        MCatName               : String; // Stone+matel+wood
        MerReqDate             : Date;
        BrandName              : String;
        CategoryCode           : String;
        CategoryUniqueNum      : String;
        OldCrfReqNo            : String;
        OldCadDetailNo         : Integer64;
        EstCostInDocCur        : Decimal(19, 2);
        EstCostInINR           : Decimal(19, 2);
        BuyerCur               : String;
        ExchRate               : Decimal(19, 2);
        CrfDelDate             : Date;
        Reamrks                : String;
        CarNo                  : String;
        ECNNo                  : String;
        MaterialCategory       : Composition of many CMaterialCategoryCommon
                                     on MaterialCategory.Parent = $self.SalesCostingHeaderUUID;
        Team                   : Composition of many CTeamCommon
                                     on Team.Parent = $self.SalesCostingHeaderUUID;
        MMenu                  : Association to one MMenu;
        MenuCode               : String           = MMenu.MenuCode;
        Template               : Association to one DTemplate;
        Stage                  : Association to one MStage;
        CopStageCode           : String           = Stage.StageCode;
        CopStageName           : String           = Stage.Description;
        // SECTION MAPPING CATEGORY WISE
        MainAssembly           : Composition of CMainAssemblyCommon;
        Stone                  : Composition of CCostingStone;
        Metal                  : Composition of CCostingMetal;
        Wood                   : Composition of CCostingWood;
        Other                  : Composition of CCostingOtherMaterial;
        Packaging              : Composition of CCostingPackaging;
        ExtraCharges           : Composition of CCostingExtraCharges;
        Accessories            : Composition of CCostingAccessories;
        Assembly               : Composition of many CAssemblyCommon
                                     on Assembly.Parent = $self.SalesCostingHeaderUUID;
        ImportedAccessory      : Composition of many CImportedAccessoryCommon
                                     on ImportedAccessory.Parent = $self.SalesCostingHeaderUUID;
        // FOR GETTING MATERIAL CATEGORY
        MaterialDetails        : Composition of many CMaterialDetailsCommon
                                     on MaterialDetails.Parent = $self.SalesCostingHeaderUUID;
        isPattern              : Boolean;
        PackagingType          : String;
        AssembledLocation      : String;
        OnlycostingRequired    : Boolean          = CrfReqUUID.OnlycostingRequired;

        //sample costing
        CrfApprovalReq         : Enum_YesNo       = CrfReqUUID.CrfApprovalReq; //PDRM meeting required
        ReCostingReq           : Enum_YesNo       = CrfReqUUID.ReCostingReq; //Repeat scenario - First stage decision
        // CostingType         : Enum_CostingType = CrfReqUUID.CostingType; //Rendering, CAD, CAD-OnlyCosting, Sample
        CostingType            : String(100); //Sales order number
        SONo                   : String(100); //Sales order number
        SOLineNo               : String(100); //Sales order LineNo
        Plant                  : String(100); //Plant name
        PlantCode              : String(100); //Plant Code
        ProdReceiptNo          : String(100); //Receipt from Production Number
        FGCode                 : String(100); //FGCode
        ProceedWithSampling    : Enum_YesNo default 'N';
        RefCrfReqNo            : Integer64        = CrfReqUUID.RefCrfReqNo;
        RefCostingNo           : Integer64;
        AccessLog              : Composition of many AccessLogDetails
                                     on AccessLog.Parent = $self.SalesCostingHeaderUUID;
        MainAttachment         : Composition of one CMainAttachment
                                     on MainAttachment.MainAttachmentGuid = $self.SalesCostingHeaderUUID;
}


entity AccessLogDetails : managed {
    key AccessLogDetailsUUID : UUID;
        user                 : Association to MUser;
        FormName             : String;
        Status               : String enum {
            Locked;
            Unlocked;
            Final;
            Moved;
        };
        Parent               : UUID;
}

entity TProductionCostingHeader : managed {
    key ProductionCostingHeaderUUID : UUID;
        CADNo                       : Int64;
        CADUUID                     : Association to TCadDetail;
        CostingNo                   : Integer64;
        FormStatus                  : Enum_CrfStatus;
        ItemCode                    : String;
        ItemDesc                    : String;
        SciplCode                   : String;
        SciplDesc                   : String;
        CostingVersion              : Integer64 default 1; //
        CostingTypeCode             : String;
        CostingTypeName             : String;
        ProductCatCode              : String;
        ProductCatName              : String;
        CrfReqDate                  : Date             = CrfReqUUID.CrfReqDate;
        TolLength                   : Decimal(19, 2)   = CrfReqUUID.TolLength;
        TolWidth                    : Decimal(19, 2)   = CrfReqUUID.TolWidth;
        TolHeight                   : Decimal(19, 2)   = CrfReqUUID.TolHeight;
        DiaTop                      : Decimal(19, 2)   = CrfReqUUID.DiaTop;
        TolDiaTop                   : Decimal(19, 2)   = CrfReqUUID.TolDiaTop;
        DiaLeft                     : Decimal(19, 2)   = CrfReqUUID.DiaLeft;
        TolDiaLeft                  : Decimal(19, 2)   = CrfReqUUID.TolDiaLeft;
        DiaRight                    : Decimal(19, 2)   = CrfReqUUID.DiaRight;
        TolDiaRight                 : Decimal(19, 2)   = CrfReqUUID.TolDiaRight;
        DiaBottom                   : Decimal(19, 2)   = CrfReqUUID.DiaBottom;
        TolDiaBottom                : Decimal(19, 2)   = CrfReqUUID.TolDiaBottom;
        TolDiameter                 : Decimal(19, 2)   = CrfReqUUID.TolDiameter;
        Diameter                    : Decimal(19, 2)   = CrfReqUUID.Diameter;
        CrfCategory                 : Enum_CrfCategory = CrfReqUUID.CrfCategory;
        InputType                   : Enum_InputType   = CrfReqUUID.InputType;
        PDNo                        : String;
        PDName                      : String;
        ClientSession               : String;
        //
        // Diameter            : Decimal(19, 2);
        Length                      : Decimal(19, 2);
        Width                       : Decimal(19, 2);
        Height                      : Decimal(19, 2);
        Unit                        : String; /* Need to get more clarity */
        UnitCode                    : String; /* Need to get more clarity */
        UnitName                    : String; /* Need to get more clarity */
        Weight                      : Decimal(19, 2);
        SeekAdvice                  : Composition of many CSeekAdviceCommon
                                          on SeekAdvice.Parent = $self.ProductionCostingHeaderUUID;
        CostingDate                 : Date;
        CostingDoneDate             : Date;
        BuyerCode                   : String;
        BuyerName                   : String;
        ApprStatus                  : Enum_ApprovalStatus;
        SaveOrSubmit                : Enum_SaveOrSubmit;
        newApprovalStatus           : Enum_ApprovalStatus;
        newApprovalComment          : String;
        CreatedByUserID             : Association to MUser;
        CostingStageCode            : Association to MStage;
        CostingStageName            : String;
        loginUserID                 : Association to MUser;
        TotalApproved               : Integer default 0;
        TotalRejected               : Integer default 0;
        FormType                    : String;
        ReqTyp                      : Enum_RequestType;
        ApprComments                : String;
        ProductCategory             : String;
        InspDraw                    : Composition of many CAttachmentCommon
                                          on InspDraw.Parent = $self.ProductionCostingHeaderUUID;
        ApprovalTransaction         : Composition of many DData
                                          on ApprovalTransaction.ObjectGuid = $self.ProductionCostingHeaderUUID;
        /**     new fields  start for COP comes from CAD */
        CrfReqUUID                  : Association to DCrfHeader;
        CrfReqNo                    : Integer64;
        PDDate                      : Date;
        // PDNo                   : String;
        appliDiamter                : Enum_YesNo default 'N';
        appliDimension              : Enum_YesNo default 'N';
        CADLevel                    : String;
        SubCatName                  : String;
        MCatCode                    : String; // Code of Stone+matel+wood
        MCatName                    : String; // Stone+matel+wood
        MerReqDate                  : Date;
        BrandName                   : String;
        CategoryCode                : String;
        CategoryUniqueNum           : String;
        OldCrfReqNo                 : String;
        OldCadDetailNo              : Integer64;
        EstCostInDocCur             : Decimal(19, 2);
        EstCostInINR                : Decimal(19, 2);
        BuyerCur                    : String;
        ExchRate                    : Decimal(19, 2);
        CrfDelDate                  : Date;
        Reamrks                     : String;
        CarNo                       : String;
        ECNNo                       : String;
        MaterialCategory            : Composition of many CMaterialCategoryCommon
                                          on MaterialCategory.Parent = $self.ProductionCostingHeaderUUID;
        Team                        : Composition of many CTeamCommon
                                          on Team.Parent = $self.ProductionCostingHeaderUUID;
        MMenu                       : Association to one MMenu;
        MenuCode                    : String           = MMenu.MenuCode;
        Template                    : Association to one DTemplate;
        Stage                       : Association to one MStage;
        CopStageCode                : String           = Stage.StageCode;
        CopStageName                : String           = Stage.Description;
        // SECTION MAPPING CATEGORY WISE
        MainAssembly                : Composition of CMainAssemblyCommon;
        Stone                       : Composition of CCostingStone;
        Metal                       : Composition of CCostingMetal;
        Wood                        : Composition of CCostingWood;
        Other                       : Composition of CCostingOtherMaterial;
        Packaging                   : Composition of CCostingPackaging;
        ExtraCharges                : Composition of CCostingExtraCharges;
        Accessories                 : Composition of CCostingAccessories;
        Assembly                    : Composition of many CAssemblyCommon
                                          on Assembly.Parent = $self.ProductionCostingHeaderUUID;
        ImportedAccessory           : Composition of many CImportedAccessoryCommon
                                          on ImportedAccessory.Parent = $self.ProductionCostingHeaderUUID;
        // FOR GETTING MATERIAL CATEGORY
        MaterialDetails             : Composition of many CMaterialDetailsCommon
                                          on MaterialDetails.Parent = $self.ProductionCostingHeaderUUID;
        isPattern                   : Boolean;
        PackagingType               : String;
        AssembledLocation           : String;
        OnlycostingRequired         : Boolean          = CrfReqUUID.OnlycostingRequired;

        //sample costing
        CrfApprovalReq              : Enum_YesNo       = CrfReqUUID.CrfApprovalReq; //PDRM meeting required
        ReCostingReq                : Enum_YesNo       = CrfReqUUID.ReCostingReq; //Repeat scenario - First stage decision
        // CostingType         : Enum_CostingType = CrfReqUUID.CostingType; //Rendering, CAD, CAD-OnlyCosting, Sample
        CostingType                 : String(100); //Sales order number
        SONo                        : String(100); //Sales order number
        SOLineNo                    : String(100); //Sales order LineNo
        Plant                       : String(100); //Plant name
        PlantCode                   : String(100); //Plant Code
        ProdReceiptNo               : String(100); //Receipt from Production Number
        FGCode                      : String(100); //FGCode

        ProceedWithSampling         : Enum_YesNo default 'N';
        RefCrfReqNo                 : Integer64        = CrfReqUUID.RefCrfReqNo;
        RefCostingNo                : Integer64;
        AccessLog                   : Composition of many AccessLogDetails
                                          on AccessLog.Parent = $self.ProductionCostingHeaderUUID;
        MainAttachment              : Composition of one CMainAttachment
                                          on MainAttachment.MainAttachmentGuid = $self.ProductionCostingHeaderUUID;
        SalesOrderNo                : String(100);
        OrderDate                   : Date;
        ExFactoryDate               : Date;
        OrderQty                    : Integer64;
        CumulativeQtyStyle          : Integer64;
        FOBPrice                    : Decimal(19, 2);
        Currency                    : String(3);
        EuroSOS                     : Decimal(19, 2);
        ExchangeRateSOS             : Decimal(19, );
        FOBValueINRSOS              : Decimal(19, 2);
}

entity CSeekAdviceCommon : managed {
    key SeekAdviceCommonGuid : UUID;
        RowNumber            : Int64;
        DepartmentCode       : String;
        DepartmentName       : String;
        QuestionToUser       : Association to one MUser;
        QuestionToUserName   : String = QuestionToUser.UserName;
        Role                 : Association to one MRole;
        Question             : String;
        Answer               : String;
        Attachment           : Composition of many DAttachment
                                   on Attachment.ReferenceGuid = SeekAdviceCommonGuid;
        // Parent                : Association to one TCostingHeader;
        Parent               : UUID;
        QuestionFromUser     : Association to one MUser;
        QuestionFromUserName : String = QuestionFromUser.UserName;
        NewAlert             : String;
        DelMark              : Enum_DelMark default 0;
        SendEmailQuestion    : Enum_YesNo default 'Y';
        SendEmailAnswer      : Enum_YesNo default 'N'
}

entity CAttachmentCommon : managed {
    key AttachmentsCommonGuid : UUID;
        // Parent                 : Association to one TCostingHeader;
        Parent                : UUID;
        AttachmentRemarks     : String;
        User                  : Association to one MUser;
        Attachment            : Composition of many DAttachment
                                    on Attachment.ReferenceGuid = AttachmentsCommonGuid;
        Stage                 : Association to one MStage;
        StageCode             : String = Stage.StageCode;
        ApprovalStatus        : Enum_ApprovalStatus default 'NA';
        DelMark               : Enum_DelMark default 0;
        Remarks               : String null;
        RowStatus             : Enum_RowStatus default 'OPEN';
        RowNumber             : Int64 default 1;
}

entity CMaterialCategoryCommon : managed {
    key MaterialCategoryCommonGuid : UUID;
        // Parent                      : Association to one TCostingHeader;
        Parent                     : UUID;
        MaterialCategoryCode       : String;
        MaterialCategoryName       : String;
        MaterialCatFreeText        : String;
        RowNumber                  : Int64;
        TestProtocol               : String;
        DelMark                    : Enum_DelMark default 0;
        Remarks                    : String;

}

entity CTeamCommon : managed {
    key TeamCommonGuid           : UUID;
        // Parent                   : Association to one TCostingHeader;
        Parent                   : UUID;
        User                     : Association to one MUser;
        DelMark                  : Enum_DelMark default 0;
        RoleGuid                 : Association to one MRole;
        RoleCode                 : String = RoleGuid.RoleCode;
        RoleName                 : String = RoleGuid.Description;
        UserName                 : String = User.UserName;
        DepartmentName           : String = User.DepartmentName;
        SubDepartmentName        : String = User.SubDepartmentName;
        DepartmentCode           : String = User.DepartmentCode;
        SubDepartmentCode        : String = User.SubDepartmentCode;
        UserMaterialCategoryCode : String;
        UserMaterialCategoryName : String;
        UserMaterialCategoryType : String;
        ProductCategoryCode      : String;
        ProductCategoryName      : String;
        ProductCatGuid           : Association to one MProductCategory;
        RowNumber                : Int64 default 1;
        MenuName                 : String; //           CRF/CAD/COP
}

entity CMaterialDetailsCommon : managed {
    key MaterialDetailsCommonGuid : UUID;
        // Parent               : Association to one TCostingHeader; // header reference
        Parent                    : UUID;
        MaterialCategoryCode      : String;
        MaterialCategoryName      : String;

        //Trupti 29062025
        MaterialCategoryType      : String;
}

entity CMainAssemblyCommon : managed {

    key MainAssemblyCommonUUID : UUID;
        // Parent                  : Association to one TCostingHeader;
        Parent                 : UUID;
        RowNumber              : Int64;
        ProductNo              : String;
        ProductName            : String;
        Quantity               : Decimal(19, 2);
        QtyUOMCode             : String;
        QtyISOUOMCode          : String;
        QtyUOMName             : String;
        Weight                 : Decimal(19, 2);
        WeightUOMCode          : String;
        WeightISOUOMCode       : String;
        WeightUOMName          : String;
        MenualWeight           : Decimal(19, 2);
        MenualWeightUOMCode    : String;
        MenualWeightISOUOMCode : String;
        MenualWeightUOMName    : String;
        PDNumber               : String;
        SCIPLCode              : String;
        Remarks                : String;
        DelMark                : Enum_DelMark default 0;


}

entity CAssemblyCommon : managed {
    key AssemblyCommonUUID    : UUID;
        // Parent                : Association to TCostingHeader;
        Parent                : UUID;
        ItemCode              : String;
        ItemName              : String;
        Qty                   : Decimal(19, 2);
        Category              : String;
        UOMCode               : String;
        UOMName               : String;
        ISOUOMCode            : String; // check
        Price                 : Decimal(19, 2);
        TotalCost             : Decimal(19, 2);
        TotalCostIncAllCharge : Decimal(19, 2); //  Need to add -Rishiraj
        OHAmount              : Decimal(19, 2);
        OHPercent             : Decimal(19, 2);
        WastagePercent        : Decimal(19, 2);
        WastageAmount         : Decimal(19, 2);
}

entity CImportedAccessoryCommon : managed {
    key ImportedAccessoryCommonUUID : UUID;
        // Parent                       : Association to TCostingHeader;
        Parent                      : UUID;
        ItemName                    : String;
        ItemCode                    : String;
        Qty                         : Decimal(19, 2);
        UnitCost                    : Decimal(19, 2); // Unit Price
        UOMCode                     : String;
        UOMName                     : String;
        Cost                        : Decimal(19, 2); // Total Cost Qty x UnitCost
        ItemDesc                    : String;
}
// SalesCOP table- END

type PROCESSFLOW            : String enum {
    Process_A = 'Process A';
    Process_B = 'Process B';
    Process_C = 'Process C';
    Process_D = 'Process D';
    Process_E = 'Process E';
    ToSelect = '-1'
};

type LABELTYPE              : String enum {
    decor;
    furnishing
};

type Enum_ApprovalStatus    : String enum {
    NA;
    APPROVED;
    REJECTED;
    PENDING;
}

type Enum_CADLevel          : String enum {
    Easy;
    Critical;
    Medium;
}

type Enum_CrfCategory       : String enum {
    CAD;
    Rendering;
    Handwritten;
}

type Enum_CrfStatus         : String enum {
    New = 'N';
    InProgress = 'WIP';
    AutoDraft = 'AutoDraft';
    Closed = 'CLS';
    Cancelled = 'C';
}

type Enum_DelMark           : Int16 enum {
    Yes = 1;
    No = 0;
}

type Enum_InputType         : String enum {
    Internal = 'I';
    External = 'E';
    ToSelect = '-1';
}

type Enum_RequestType       : String enum {
    New = 'N';
    Revision = 'R';
    ToSelect = '-1';
}

type Enum_RowStatus         : String enum {
    OPEN;
    CLOSED;
    NA;
    REFERENCE; //NEWLY ADDED
}

type Enum_SaveOrSubmit      : String enum {
    SAVE;
    SUBMIT;
    HOLD;
}

type Enum_StageFlowScenario : String enum {
    NA;
    APPROVED;
    REJECTED;
}

// type Enum_UserType          : Integer enum { removed by Rishiraj 20/01/2025
//     Approval_non_Mandatory_User = 2;
//     Approval_Mandatory_User     = 3;
//     Workflow_User               = 1;
// }

type Enum_YesNo             : String enum {
    Yes = 'Y';
    No = 'N';
}
