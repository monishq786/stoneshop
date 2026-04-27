using {Stonemen as db} from '../db/stonemen-schema';

service StonemanCADService {
   entity TCadDetail         as select from db.TCadDetail;
   entity TCadSeekAdvice     as select from db.CCADSeekAdvice;
   // entity TCadDetailInspDrawDetail      as select from db.TCadDetailInspDrawDetail;
   // entity TCadDetailApprovalTransaction as select from db.TCadDetailApprovalTransaction;
   entity TCadDetailMaterial as select from db.TCadDetailMaterial;
   entity TCadMainAssembly   as select from db.TCadMainAssembly;
   //  entity TCadSubAssembly               as select from db.TCadSubAssembly;
   entity TCadChildAssembly  as select from db.TCadChildAssembly;
   entity CCADTeam           as projection on db.CCADTeam;

   action MyCADDetailDocuments(guid: UUID,
                               BUYERCODE: String,
                               CADDETAILNO: Integer,
                               CRFSTATUS: String,
                               CRFREQDATE: String,
                               Techno_Guid: UUID,
                               PDCNo_Guid: UUID) returns array of String;

   action getCadDetailData(BUYERCODE: String,
                           CrfReqNo: String,
                           ProductCategoryName: String,
                           CADDETAILNO: String,
                           MatGroupName: String,
                           CadStatus: String,
                           CrfDelDate: Date,
                           CrfCategory: String,
                           loginUserId: String,
                           PendingWithMe: Boolean)  returns array of TCadDetail;

   action GetEnableDisable(DocumentGuid: String,
                           LoginGuid: String,
                           RoleGuid: String,
                           StageGuid: String)    returns array of {
      ControlName : String;
      ControlId   : String;
      Enabled     : Boolean;
   };

   action GetProcessData(Type: String)           returns array of String;

}
