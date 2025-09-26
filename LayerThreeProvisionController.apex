public without sharing class LayerThreeProvisioningController {
   
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAccount(String acctId, Otp__c Otp1){
        try {
            Account acc = [Select id,Name, Curricula__c, billingCity, MASH_AccountNumber__c,Phone,Email__c,billingStreet,RecordTypeId
                           from account where id =: acctId Limit 1];
            Otp__c otp = [SELECT id,MASH_Quote__r.SBQQ__Opportunity2__c,MASH_Quote__r.SBQQ__Opportunity2__r.MASH_School_Type__c, MASH_Quote__r.SBQQ__Opportunity2__r.MASH_Grade_adjustment__c,MASH_Quote__r.SBQQ__Opportunity2__r.Type,MASH_Quote__r.MASH_Academic_Year__c, MASH_Quote__c  FROM otp__c WHERE id =:Otp1.Id LIMIT 1];
           
            if(acc.curricula__c == null) {
                acc.curricula__c = '';
            }
            return new Map<String, String> {
                'id' => acc.id,
                    'name' => acc.Name,
                    'curriculum' => acc.Curricula__c,
                    'billingCity' => acc.billingCity,
                    'accountNumber' => acc.MASH_AccountNumber__c,
                    'phone' => acc.Phone,
                    'email' => acc.Email__c,
                    'billingStreet' => acc.billingStreet,
                    'recordTypeId' => acc.RecordTypeId,
                    'opportunity' => otp.MASH_Quote__r.SBQQ__Opportunity2__c
                    // 'academicYear' => SBQQ__Quote__c.MASH_Academic_Year__c
                    // 'authority/organization' => Opportunity.MASH_School_Type__c
                    };
                        } catch (Exception e) {
                            throw new AuraHandledException(e.getMessage());
                        }
    }
   
    @AuraEnabled
    public static TemplateDownloadWrapper getTemplateForDownload(Id oppId) {
        system.debug('oppId '+oppId);
        TemplateDownloadWrapper result = new TemplateDownloadWrapper();
        result.urls = new List<String>();
        result.productLine = new List<String>();
       
        try {
            // Fetch only required fields
            Opportunity opp = [
                SELECT ProductLine__c
                FROM Opportunity
                WHERE Id = :oppId AND ProductLine__c != null
                LIMIT 1
            ];
            system.debug('opp '+opp);
            // Split multi-picklist into values
            Set<String> productLines = new Set<String>(opp.ProductLine__c.split(';'));
            system.debug('productLines '+productLines);
            // Add product lines to wrapper
            result.productLine.addAll(productLines);
           
            // Query all mappings for the selected product lines
            List<ProductLineToContentMap__mdt> mappings = [
                SELECT Product_Line__c, Content_Name__c
                FROM ProductLineToContentMap__mdt
                WHERE Product_Line__c IN : productLines
            ];
            system.debug('mappings '+mappings);
            Set<String> templateNames = new Set<String>();
           
            for (ProductLineToContentMap__mdt mapRec : mappings) {
                templateNames.add(mapRec.Content_Name__c);
            }
            system.debug('templateNames '+templateNames);
            List<String> urls = new List<String>();
            // Use templates list to fetch ContentDistribution or generate download URLs
            List<ContentDistribution> contentDistList = [
                SELECT Id, Name, ContentDownloadUrl
                FROM ContentDistribution
                WHERE Name IN :templateNames
            ];
            for (ContentDistribution doc : contentDistList) {
                result.urls.add(doc.ContentDownloadUrl);
            }
            system.debug('urls '+urls.size()+ '  '+urls);
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Error in getTemplateForDownload: ' + e.getMessage());
        }
    }
   
    @AuraEnabled
    public static string submitProvisioning(String acctId, String selectedGender, String subjectName, String AcctEmail,String quoteId,  List<Map<String, String>> schholTemplateFileData, List<Map<String,String>> contactstoCreate,Map<String, String> acct, Map<String, String> related){
        try {
            system.debug('schholTemplateFileData '+schholTemplateFileData.size());
            // String fileName =  schholTemplateFileData.get('filename');
            // String base64Data = schholTemplateFileData.get('base64');
            Account acctDetail = [SELECT ID, OwnerID, Owner.Email, PrimaryContact__c, PrimaryContact__r.Name, PrimaryContact__r.Email FROM Account WHERE Id =:acctId ];
           
            SBQQ__Quote__c quote = [SELECT ID, SBQQ__Opportunity2__c, MASH_Subscription_Sent__c FROM SBQQ__Quote__c WHERE Id =: quoteId LIMIT 1];
            quote.MASH_Subscription_Sent__c = true;
            update quote;
           
            String CaseDescription = '';
            CaseDescription += 'School name : '+acct.get('name') +',\n ';
            CaseDescription += 'Gender : '+selectedGender +',\n';
            CaseDescription += 'City : '+acct.get('billingCity') +',\n';
            CaseDescription += 'School ID number : '+acct.get('accountNumber') +',\n';
            CaseDescription += 'Curriculum : '+acct.get('curriculum') +',\n';
            CaseDescription += 'Authority/Organization : '+related.get('school') +',\n';
            CaseDescription += 'Phone number : '+acct.get('phone') +',\n';
            CaseDescription += 'Account Email Address : '+ acct.get('email') +'; ';
            CaseDescription += 'Sales Person Email : '+ acctDetail.Owner.Email +'; ';
            CaseDescription += 'School Address : '+acct.get('billingStreet') +',\n';
            CaseDescription += 'Academic Year : '+related.get('acyear') +',\n';
            CaseDescription += 'School Type : '+related.get('type') +',\n';
            CaseDescription += 'Grade Adjustment : '+related.get('grade') +',\n';
            //CaseDescription += 'Contact : ';
           
            String CaseDescriptionHTML = '';
            CaseDescriptionHTML += '<div> School name : '+acct.get('name') +'</div> ';
            CaseDescriptionHTML += '<div> Gender : '+selectedGender +'</div>';
            CaseDescriptionHTML += '<div> City : '+acct.get('billingCity') +'</div>';
            CaseDescriptionHTML += '<div> School ID number : '+acct.get('accountNumber') +'</div>';
            CaseDescriptionHTML += '<div> Curriculum : '+acct.get('curriculum') +'</div>';
            CaseDescriptionHTML += '<div> Authority/Organization : '+related.get('school') +'</div>';
            CaseDescriptionHTML += '<div> Phone number : '+acct.get('phone') +'</div>';
            CaseDescriptionHTML += '<div> Account Email Address : '+ acct.get('email') +'; ';
            CaseDescriptionHTML += '<div> Sales Person Email : '+ acctDetail.Owner.Email +'; ';
            CaseDescriptionHTML += '<div> School Address : '+acct.get('billingStreet') +'</div>';
            CaseDescriptionHTML += '<div> Academic Year : '+related.get('acyear') +'</div>';
            CaseDescriptionHTML += '<div> School Type : '+related.get('type') +'</div>';
            CaseDescriptionHTML += '<div> Grade Adjustment : '+related.get('grade') +'</div>';
           
            List<Case> caseList = new List<Case>();
            for (Integer i = 0; i < schholTemplateFileData.size(); i++) {
                caseList.add(new Case(
                    Status = 'Open',
                    AccountId = acctId,
                    Subject = subjectName,
                    SuppliedEmail = acctEmail,
                    OwnerId = acctDetail.OwnerId
                ));
            }
           
            if (!caseList.isEmpty()) {
                insert caseList;
            }
            system.debug('caseList '+caseList);
           
            Integer i =0;
            system.debug('schholTemplateFileData '+schholTemplateFileData);
            if (schholTemplateFileData != null && !schholTemplateFileData.isEmpty()) {
                for (Map<String, String> fileData : schholTemplateFileData) {
                    String fileName = fileData.get('filename');
                    String base64Data = fileData.get('base64');
                    system.debug('fileName '+fileName);
                    LayerOneSubscriptionController.saveFile(caseList[i].Id, fileName, base64Data);
                    i++;
                }  
            }
           
            //LayerOneSubscriptionController.saveFile(caseList.Id, fileName, base64Data);
           
            Integer count = 1;
            List<Contact> contactLst = new List<Contact>();
            CaseDescriptionHTML += '<div><table><tr><td>Title</td><td>First Name</td><td>Last Name</td><td>Email</td></tr>';
            for(Map<string,String> con : contactstoCreate){
                CaseDescription += '\nContact '+ count +' : [ ';
                CaseDescriptionHTML += '<tr>';
                String title = null;  
                if(con.get('title') != null){
                    if(con.get('title').equalsIgnoreCase('admin')) title = 'Administrator'; // old name : CEO
                    else if(con.get('title').equalsIgnoreCase('principal')) title = 'Principal';
                    else if(con.get('title').equalsIgnoreCase('HOD')) title = 'Head Of Department';
                    count++;
                }
               
                Contact contactToCreate = new Contact(
                    Salutation = 'Dr.', // temporarily
                    Firstname = con.get('firstName'),
                    Lastname = con.get('lastName'),
                    Email =  con.get('email'),
                    JobTitle__c = title,
                    AccountId = acctId,
                    Opportunity__c = quote.SBQQ__Opportunity2__c,
                    MASH_Related_Case__c = caseList[0].Id,
                    MASH_IsMaster__c = Boolean.valueof(con.get('primary'))
                );
                contactLst.add(contactToCreate);
                //Sales rep email address
               
                CaseDescription += 'Title : '+ title +'; ';
                CaseDescription += 'firstName : '+ con.get('firstName') +'; ';
                CaseDescription += 'lastName : '+ con.get('lastName') +'; ';
                CaseDescription += 'email : '+ con.get('email') +'; ';
                CaseDescription += ' ] ';
                CaseDescriptionHTML += '<td>' + title + '</td>';
                CaseDescriptionHTML += '<td>' + con.get('firstName') + '</td>';
                CaseDescriptionHTML += '<td>' + con.get('lastName') + '</td>';
                CaseDescriptionHTML += '<td>' + con.get('email') + '</td>';
                CaseDescriptionHTML += '</tr>';
            }
            CaseDescriptionHTML += '</table></div>';
            System.debug('contactLst: ' + contactLst);
            insert contactLst;
           
            for(Case c : caseList){
                c.Description = CaseDescription;
                c.Description_HTML__c = CaseDescriptionHTML;
                c.Opportunity__c = quote.SBQQ__Opportunity2__c;
                c.MASH_Form_Uploaded__c = true;
            }
            update caseList;
            return 'Success!';
        } catch (Exception e) {
            System.debug('Error at line: ' + e.getLineNumber() + ' | Message: ' + e.getMessage());
            throw new AuraHandledException(
                'Error at line ' + e.getLineNumber() + ': ' + e.getMessage()
            );
        }
    }
   
    @AuraEnabled(cacheable=true)
    public static Map<String,String> getRelated(Otp__c Otp1){
        system.debug('getREalated');
        try {
            Otp__c otp = [SELECT id,MASH_Quote__r.SBQQ__Opportunity2__c,MASH_Quote__r.SBQQ__Opportunity2__r.MASH_School_Type__c, MASH_Quote__r.SBQQ__Opportunity2__r.MASH_Grade_adjustment__c,MASH_Quote__r.SBQQ__Opportunity2__r.Type,MASH_Quote__r.MASH_Academic_Year__c, MASH_Quote__c  FROM otp__c WHERE id =:Otp1.Id LIMIT 1];
            Order ord = [SELECT id FROM Order WHERE SBQQ__Quote__c =:otp.MASH_Quote__c LIMIT 1];
           
            String check = null;
           
            if (otp.MASH_Quote__r.SBQQ__Opportunity2__r.MASH_Grade_adjustment__c) {
                check = 'true';
            }
           
            return new Map<String, String> {
                'quote' => otp.MASH_Quote__c,
                    'opportunity' => otp.MASH_Quote__r.SBQQ__Opportunity2__c,
                    'school' => otp.MASH_Quote__r.SBQQ__Opportunity2__r.MASH_School_Type__c == null ? '': otp.MASH_Quote__r.SBQQ__Opportunity2__r.MASH_School_Type__c ,
                        'grade' => check,
                        'order' => ord.id,
                        'acyear' => otp.MASH_Quote__r.MASH_Academic_Year__c,
                        'type' => otp.MASH_Quote__r.SBQQ__Opportunity2__r.Type
                        };
                            } catch (Exception e) {
                                throw new AuraHandledException(e.getMessage());
                            }
    }
   
    public class TemplateDownloadWrapper {
        @AuraEnabled public List<String> urls;
        @AuraEnabled public List<String> productLine;
    }
   
}

