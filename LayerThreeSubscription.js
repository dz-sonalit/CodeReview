/* eslint-disable dot-notation */
/* eslint-disable array-callback-return */
/* eslint-disable vars-on-top */
/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
import { LightningElement, api, track, wire } from 'lwc';
import getAccount from '@salesforce/apex/LayerThreeProvisioningController.getAccount';
import getRelated from '@salesforce/apex/LayerThreeProvisioningController.getRelated';
import getTemplateForDownload from '@salesforce/apex/LayerThreeProvisioningController.getTemplateForDownload';
// eslint-disable-next-line no-unused-vars
import saveFile from '@salesforce/apex/LayerOneSubscriptionController.saveFile';
import submitProvisioning from '@salesforce/apex/LayerThreeProvisioningController.submitProvisioning';
import { reduceErrors } from 'c/ldsUtils';
import { loadScript } from 'lightning/platformResourceLoader';
// import FILE_DOWNLOAD from '@salesforce/resourceUrl/FileDownloadLibrary';
import {getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";


import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import CURRICULA_FIELD from '@salesforce/schema/Account.Curricula__c';
import FIRSTNAME_FIELD from '@salesforce/schema/Contact.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/Contact.LastName';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';






export default class LayerThreeSubscription extends LightningElement {
@api otp;
@api acctId;
error;
errorInTabularForm = false;
step1Form = true;
finalStep= false;
isLoading = false;
accountRecord;
relatedMap;
accountRecordTypeId;
selectedSchoolType
selectedGender
//schoolTemplateFileName;
//schholTemplateFileData;
@track schholTemplateFileData = [];
@track schoolTemplateFileNames = [];


schoolTemplateFileUrl;


index = 2;//0;//2
@track showRolesPicklist = false;
selectedRole;
@track adminFlag = false;
checked = true;
showCheckbox = false;
errorInTabularFormCombo = false;
errorInTabularFormCombo1 = false;
errorInTabularFormCombo2 = false;
@track productLines;
@track oppId;
errorMessage = '';


columns = [
{ label: 'Title', fieldName: 'title', editable: false, initialWidth: 30},
{ label: 'First Name', fieldName: FIRSTNAME_FIELD.fieldApiName, editable: true},
{ label: 'Last Name', fieldName: LASTNAME_FIELD.fieldApiName, editable: true},
{ label: 'Email', fieldName: EMAIL_FIELD.fieldApiName, type: 'email', editable: true },
];


@track contactsData = [
{ id: 0, dataidFirstName: 'adminFirstName',dataidLastName: 'adminLastName',dataidEmail: 'adminEmail', title: 'Admin', firstName: '', lastName: '',email: '', primary: true },
{ id: 1, dataidFirstName: 'principalFirstName',dataidLastName: 'principalLastName',dataidEmail: 'principalEmail',title: 'Principal', firstName: '', lastName: '',email: '', primary: false },
{ id: 2,dataidFirstName: 'HOD1FirstName',dataidLastName: 'HOD1LastName',dataidEmail: 'HOD1Email',title: 'HOD', firstName: '', lastName: '',email: '', primary: false },


];


get showDeletecontactRowAction(){
return this.index >= 3;// 1; //3
}


get deleteIconTitle(){
return this.index >= 3 ? 'Delete': 'You can\'t delete the 1st 3 rows'; //2//3
}
get disableAddRowButton(){
return this.index >= 17;
}


get SchoolTypeOptions(){
return  [
    { label: 'KHDA', value: 'KHDA' },
    { label: 'SOEA', value: 'SOEA' },
    { label: 'MOE-North', value: 'MOE-North' },
    { label: 'Indian Schools', value: 'Indian Schools' },
];
}


get genderOptions(){
return  [
    { label: 'Only Boys', value: 'Only Boys' },
    { label: 'Only Girls', value: 'Only Girls' },
    { label: 'Mixed', value: 'Mixed' },
];
}


get roleOptions(){
return  [
    { label: 'Admin', value: 'Admin' },
    { label: 'Principal', value: 'Principal' },
    { label: 'HOD', value: 'HOD' },
];
}


get curriculumOptions(){
return [
    { label: 'Advanced Placement Program', value: 'Advanced Placement Program' },
    { label: 'AP Capstone', value: 'AP Capstone' },
    { label: 'Australian curriculum', value: 'Australian curriculum' },
    { label: 'Bilingual programme', value: 'Bilingual programme' },
    { label: 'BTEC', value: 'BTEC' },
    { label: 'Cambridge Advanced', value: 'Cambridge Advanced' },
    { label: 'Cambridge AICE Diploma Curriculum', value: 'Cambridge AICE Diploma Curriculum' },
    { label: 'Cambridge Primary', value: 'Cambridge Primary' },
    { label: 'Cambridge Secondary', value: 'Cambridge Secondary' },
    { label: 'Canadian curriculum', value: 'Canadian curriculum' },
    { label: 'French national curriculum', value: 'French national curriculum' },
    { label: 'German curriculum', value: 'German curriculum' },
    { label: 'IB Career-related Programme', value: 'IB Career-related Programme' },
    { label: 'IB Diploma Programme', value: 'IB Diploma Programme' },
    { label: 'IB Middle Years Programme', value: 'IB Middle Years Programme' },
    { label: 'IB Primary Years Programme', value: 'IB Primary Years Programme' },
    { label: 'Indian curriculum', value: 'Indian curriculum' },
    { label: 'International Early Years Curriculum', value: 'International Early Years Curriculum' },
    { label: 'International Pre-School Curriculum', value: 'International Pre-School Curriculum' },
    { label: 'International Primary Curriculum', value: 'International Primary Curriculum' },
    { label: 'Montessori', value: 'Montessori' },
    { label: 'National curriculum', value: 'National curriculum' },
    { label: 'Other English-Medium curriculum', value: 'Other English-Medium curriculum' },
    { label: 'Other Non-English-Medium curriculum', value: 'Other Non-English-Medium curriculum' },
    { label: 'Pearson Edexcel iPrimary', value: 'Pearson Edexcel iPrimary' },
    { label: 'Reggio Emilia Approach', value: 'Reggio Emilia Approach' },
    { label: 'Singapore national curriculum', value: 'Singapore national curriculum' },
    { label: 'Steiner Waldorf', value: 'Steiner Waldorf' },
    { label: 'UK curriculum', value: 'UK curriculum' },
    { label: 'US curriculum', value: 'US curriculum' },
    { label: 'Other', value: 'Other' },
];
}






// async connectedCallback() {
//     // Load the file download library
//     await loadScript(this, FILE_DOWNLOAD);


//     // Define the file URL
//     const fileUrl = '/servlet/servlet.FileDownload?file={Attachment Id}&operationContext=S1';


//     // Trigger the download
//     const downloadLink = document.createElement('a');
//     downloadLink.href = fileUrl;
//     downloadLink.download = 'my-file.pdf'; // Specify the desired file name
//     downloadLink.click();
// }


// @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
// results({ error, data }) {
//     if (data) {
//         console.log('data: '+ JSON.stringify(data));
//         this.accountRecordTypeId = data.defaultRecordTypeId;
//         this.error = undefined;
//     } else if (error) {
//         this.error = reduceErrors(error);
//         this.accountRecordTypeId = undefined;
//     }
// }


// @wire(getRecord, { recordId: "$acctId", fields: "RecordTypeId"})
// getRecordResults({ error, data }) {
//     if (data) {
//         console.log('getRecord data: '+ JSON.stringify(data));
//         this.accountRecordTypeId = data.recordTypeId;
//         this.error = undefined;
//     } else if (error) {
//         this.error = reduceErrors(error);
//         this.accountRecordTypeId = undefined;
//         console.log('getRecord error: '+ this.error);
//     }
// }


/*@wire(getPicklistValues, { recordTypeId: "$accountRecord.recordTypeId", fieldApiName: CURRICULA_FIELD })
curricullumMultiSelectOptions({ error, data }) {
if (data) {
    this.curriculumOptions = data.values;
    this.error = undefined;
}
else if (error) {
    this.error = reduceErrors(error);
    this.curriculumOptions = undefined;
    console.log('getPicklistValues error: '+ this.error);
}
}*/


async downloadSchoolTemplate() {
try {
    console.log('oppId '+this.oppId);
    const result = await getTemplateForDownload({oppId : this.oppId}); // returns array of URLs
    console.log('pline '+result.productLine);
    //console.log('result '+JSON.stringify(result));
                this.productLines = result.productLine || [];
console.log('pr line '+this.productLines);
const fileUrls = result.urls || [];
    console.log('len '+fileUrls.length);
    if (fileUrls && fileUrls.length > 0) {
        for (let url of fileUrls) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank'; // open in new tab (or remove for automatic download)
            link.download = '';     // optional: you can set a filename if desired
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        console.warn('No templates found.');
    }
} catch (error) {
    console.error('Error downloading templates:', error);
}
}
get acceptedSchoolTemplatefileFormats(){
return ['.xlsx'];
}




@wire(getRelated,{ Otp1 : '$otp'})
opps;
/*handleRelated({error,data}){
if (data) {
    this.relatedMap = data;
    console.log('relatedMap: '+ JSON.stringify(this.relatedMap));
} else if (error) {  
    console.log('error related: '+ JSON.stringify(error));
    this.showErrorMessage  = true;
    this.error =  reduceErrors(error);
}
}*/








@wire(getAccount, { acctId : '$acctId', Otp1 : '$otp'})
handleAccount({error, data}) {
if (data) {
    this.accountRecord = data;
    this.oppId = this.accountRecord.opportunity;
    console.log('accountRecord: '+ JSON.stringify(this.accountRecord));
} else if (error) {  
    console.log('error: '+ JSON.stringify(error));
    this.showErrorMessage  = true;
    this.error =  reduceErrors(error);
}
}




handleSchoolTypeChange(event){
this.selectedSchoolType = event.detail.value;
}


handleGenderChange(event){
this.selectedGender = event.detail.value;
}


saveFileHandle(event) {
    const files = event.target.files;
    this.schholTemplateFileData = []; // clear previously stored files
    this.schoolTemplateFileNames = [];
    let invalidFiles = [];


    console.log('Files selected:', files.length);
    console.log('Product Lines:', this.productLines);


    // Helper to normalize text (ignore spaces and case)
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');


    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();


        // ✅ Validate file name against product lines
        const hasValidProductLine = this.productLines.some(pl =>
            normalize(fileName).includes(normalize(pl))
        );


        console.log(`Checking file: ${file.name}, Valid: ${hasValidProductLine}`);


        if (!hasValidProductLine) {
            invalidFiles.push(file.name);
            continue; // Skip invalid files
        }


        // ✅ Process only valid files
        const reader = new FileReader();
        reader.onload = ((currentFile) => {
            return () => {
                const base64 = reader.result.split(',')[1];
                const fileObj = {
                    filename: currentFile.name,
                    base64: encodeURIComponent(base64),
                    type: currentFile.type
                };


                this.schholTemplateFileData = [...this.schholTemplateFileData, fileObj];
                this.schoolTemplateFileNames = [...this.schoolTemplateFileNames, currentFile.name];


                console.log('✅ File processed:', currentFile.name);
            };
        })(file);


        reader.readAsDataURL(file);
    }
     if (invalidFiles.length > 0) {
        this.errorMessage = `The following files do not match any Product Line: ${invalidFiles.join(', ')}.Please rename them to follow the correct format: "<Existing File Name> - <Your Company Name / Other>".`;
    } else {
        this.errorMessage = ''; // clear message if all good
    }
    console.log(' this.errorMessage '+ this.errorMessage);
}


submitProvisioning(event){
console.log('this.opps : ' + this.opps);
console.log('this.opps data: ' + JSON.stringify(this.opps));
console.log('quote id ' + this.opps.data.quote);


this.checkcontactsTabularForm(event);
let formValidity = this.checkFormInputValidity(event);


console.log('formValidity: '+ formValidity);
if(formValidity){
    this.isLoading = true;
    // if(this.accountRecord.curriculum && Array.isArray(this.accountRecord.curriculum)){
    //     this.accountRecord = {...this.accountRecord , 'curriculum': this.accountRecord.curriculum.join(';')};
    // }


    const contactstoCreate = this.contactsData.map(({title, firstName,lastName,email,primary}) => ({title, firstName,lastName,email,primary}));
    console.log('contactstoCreate: '+ JSON.stringify(contactstoCreate));


    var subjectName = 'School Provisioning ' + this.accountRecord.name + '-' + this.accountRecord.accountNumber;
    console.log('the subject is: ' + subjectName);
    submitProvisioning({
        acctId: this.acctId,
        selectedGender: this.selectedGender,
        subjectName: subjectName,
        AcctEmail: this.accountRecord.email,
        quoteId: this.opps.data.quote,
        // selectedSchoolType: this.selectedSchoolType,
        schholTemplateFileData: this.schholTemplateFileData,
        contactstoCreate: contactstoCreate,
        acct: this.accountRecord,
        related: this.opps.data
    })
    .then(result => {
        console.log('result: '+ JSON.stringify(result));
        this.accountRecord = null;
        this.finalStep = true;
    }).catch(error => {
        console.log('error: '+ JSON.stringify(error));
        this.showErrorMessage  = true;
        this.error =  reduceErrors(error);
    }).finally(() => {
        this.isLoading = false;        
    });
}
}


checkFormInputValidity(evt){        
    // Validate standard inputs and comboboxes
    let allValid = [
        ...this.template.querySelectorAll('lightning-input'),
        ...this.template.querySelectorAll('lightning-combobox'),
    ].reduce((validSoFar, inputCmp) => {
        inputCmp.reportValidity();
        return validSoFar && inputCmp.checkValidity();
    }, true);


    // ✅ Custom validation for file uploader
    const fileInput = this.template.querySelector('lightning-input[data-id="schoolTemplate"]');
    console.log('fileInput len'+ fileInput.files.length+' len '+ fileInput);
    if (!fileInput || fileInput.files.length === 0) {
        console.log('1 0');
        fileInput.setCustomValidity('Please upload a valid file before submitting.');
        fileInput.reportValidity();
        allValid = false;
    }else if (this.errorMessage) {
         console.log('1 1');
        // If you already set an error message (invalid file format), block submission
        fileInput.setCustomValidity(this.errorMessage);
        fileInput.reportValidity();
        allValid = false;
        console.log('1 1'+allValid);
    } else {
        console.log('last -1 '+allValid);
        fileInput.setCustomValidity('');
        fileInput.reportValidity();
        allValid = allValid && fileInput.checkValidity();
        //allValid = true;
        console.log('last 124'+allValid);
    }
console.log('test validity'+allValid);
    return allValid;
}


handleAddRow() {
let numberOfExistingRows = this.contactsData.length;
if(numberOfExistingRows < 18){
    let rowId = numberOfExistingRows;// - 1; // starting vlaue HOD2 => [3-2+1 = 2 =>]
    let id = rowId;// 'HOD'+ rowId;
    let dataidFirstName =  id + 'FirstName';
    let dataidLastName = id + 'LastName';
    let dataidEmail = id + 'Email';
    let addContactDataRow = [...this.contactsData,{ id: id,dataidFirstName: dataidFirstName ,dataidLastName: dataidLastName ,dataidEmail: dataidEmail, title: '', firstName: '', lastName: '',email: '', primary: false }];
    this.contactsData = [...addContactDataRow];
    this.index += 1;
}


}


// handleRemoveRow(event){
//     let rowId = event.target.dataset.id;
//     console.log('rowId: '+ rowId);


//     let recordIndex = this.contactsData.findIndex((record)=>record.id === event.target.dataset.id);
//     this.contactsData.splice(recordIndex, 1);
//     this.contactsData = [...this.contactsData];
// }


handleRemoveRow(event){
this.isLoaded = true;
var selectedRow = event.currentTarget;
var key = selectedRow.dataset.id;


let  target = event.target;
let  targetId = target.dataset.id;
console.log('currentTarget: '+ selectedRow);
console.log('currentTarget id: '+ key);
console.log('target: '+ target);
console.log('target id: '+ targetId);


if(targetId>2){
    this.contactsData.splice(key, 1);
    this.index--;
    this.isLoaded = false;
    this.resetContactsDataIndex();
}
}


resetContactsDataIndex(){
console.log('OldContactData-->'+JSON.stringify(this.contactsData));
for (let index = 0; index < this.contactsData.length; index++) {
    this.contactsData[index].id = index;
    this.contactsData[index].dataidFirstName = index + 'FirstName';
    this.contactsData[index].dataidLastName =index + 'LastName';
    this.contactsData[index].dataidEmail = index + 'Email';
    // this.contactsData[index].dataidEmail = index + 'Email';
}
console.log('newContactData-->'+JSON.stringify(this.contactsData));
this.contactsData= JSON.parse(JSON.stringify(this.contactsData));
}


checkcontactsTabularForm(evt) {
this.errorInTabularForm = false;
let tableInputs = this.template.querySelectorAll('.contactsTableBody tr td lightning-input');
tableInputs.forEach((element) => {
    console.log('element value: '+ element.value);
    if (!element.value) {
        element.setCustomValidity("Complete this field");
        this.errorInTabularForm = true;
    } else {
        element.setCustomValidity("");
    }
    element.reportValidity();
});
//Role Picklist
let tableInputs1 = this.template.querySelectorAll('.contactsTableBody tr td lightning-combobox');
tableInputs1.forEach((element) => {
console.log('element value: '+ element.value);
if (!element.value) {
    element.setCustomValidity("Complete this field");
    this.errorInTabularForm = true;
} else {
    element.setCustomValidity("");
}
element.reportValidity();
});
let cnt=0;
let tableInputs2 = this.template.querySelectorAll('.contactsTableBody tr td lightning-combobox');
tableInputs2.forEach((element) => {
console.log('element value: '+ element.value);
if (element.value != 'Admin' && cnt == 0 && this.errorInTabularFormCombo == true) {
    element.setCustomValidity("Complete this field admin");
} else  if (element.value != 'Principal' && cnt == 1 && this.errorInTabularFormCombo1 == true) {
    element.setCustomValidity("Complete this field p");
}else if (element.value != 'HOD' && cnt == 2 && this.errorInTabularFormCombo2 == true) {
    element.setCustomValidity("Complete this field hod");
}else {
    element.setCustomValidity("");
}
cnt++;
});
}


handleContactRowChange(event) {
if(this.errorInTabularForm){
    this.checkcontactsTabularForm(event);
}
console.log('event: '+ JSON.stringify(event.detail.value));
let evt = JSON.stringify(event.detail.value);
let dataid = event.target.dataset.id;
console.log('dataid: '+ dataid);
console.log('contactsData before: '+ JSON.stringify(this.contactsData));


let tableInputs1 = this.template.querySelectorAll('.contactsTableBody tr td lightning-combobox');
//console.log('tableInputs1-'+tableInputs1);
tableInputs1.forEach((element) => {
    console.log('element value: '+ element.value);
    if(dataid == 0 && element.value != 'Admin'){
        console.log('First Row');
        element.setCustomValidity("Please select Admin for first row entry!");
        this.errorInTabularFormCombo = true;
    } else if(dataid == 0 && element.value == 'Admin'){
        element.setCustomValidity("");
        this.errorInTabularFormCombo = false;
    }
    if(dataid == 1 && element.value != 'Principal'){
        console.log('Second Row');
        element.setCustomValidity("Please select Principal for second row entry!");
        this.errorInTabularFormCombo1 = true;
    } else if(dataid == 1 && element.value == 'Principal'){
        element.setCustomValidity("");
        this.errorInTabularFormCombo1 = false;
    }
    if(dataid == 2 && element.value != 'HOD'){
        console.log('Third Row');
        element.setCustomValidity("Please select HOD for third row entry!");
        this.errorInTabularFormCombo2 = true;
    } else if(dataid == 2 && element.value == 'HOD'){
        element.setCustomValidity("");
        this.errorInTabularFormCombo2 = false;
    }    
    // element.reportValidity();  
});    


/*
if(dataid == 0 && tableInputs1.value != 'Admin'){
    tableInputs1.setCustomValidity("Please select Admin for first row entry!");
    this.errorInTabularFormCombo = true;
} else if(dataid == 0 && tableInputs1.value == 'Admin'){
    tableInputs1.setCustomValidity("");
    this.errorInTabularFormCombo = false;
}


if(dataid == 1 && event.detail.value != 'Principal'){
    console.log('Second Row'+ evt + ' ' + dataid + ' '+ tableInputs1.value);
    tableInputs1.setCustomValidity("Please select Principal for second row entry!");
    this.errorInTabularFormCombo1 = true;
} else if(dataid == 1 && event.detail.value == 'Principal'){
    tableInputs1.setCustomValidity("");
    this.errorInTabularFormCombo1 = false;
}


if(dataid == 2 && tableInputs1.value != 'HOD'){
    console.log('Third Row'+ evt + ' ' + dataid + ' '+ tableInputs1.value);
    tableInputs1.setCustomValidity("Please select HOD for third row entry!");
    this.errorInTabularFormCombo2 = true;
} else if(dataid == 2 && tableInputs1.value == 'HOD'){
    tableInputs1.setCustomValidity("");
    this.errorInTabularFormCombo2 = false;
}
*/
console.log(this.errorInTabularFormCombo);
this.contactsData.filter(contact => {
    if(contact.id == dataid){
        contact['title']= event.detail.value;
    } else if(contact.dataidFirstName == dataid){
        contact['firstName']= event.detail.value;
    }
    else if(contact.dataidLastName == dataid){
        contact['lastName']= event.detail.value;
    }
    else if(contact.dataidEmail == dataid){
        contact['email']= event.detail.value;
    }
})
console.log('contactsData after: '+ JSON.stringify(this.contactsData));
}
}

