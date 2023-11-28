
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: "us-east-1",
});

const ses = new AWS.SES();
const dynamoDB = new AWS.DynamoDB();
const base64PrivateKey = process.env.GOOGLE_SECRET_ACCESS_KEY // Replace with your actual base64-encoded private key
const decodedPrivateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf-8');
// const formattedPrivateKey = decodedPrivateKey.replace(/\\n/g, '\n');
// const formattedPrivateKey = String.raw`${decodedPrivateKey}`;
//const formattedPrivateKey = decodedPrivateKey.replace(/\\n/g, '\n').replace(/\n/g, '\n');
const formattedPrivateKey = JSON.parse(decodedPrivateKey)["private_key"];

const storage = new Storage({
  projectId: "excellent-range-405701",
  credentials: {
    client_email: process.env.GOOGLE_ACCESS_KEY_ID,
    private_key:formattedPrivateKey
  },
});

export const handler = async (event, context) => {
  let domainName = event.Records[0].Sns.MessageAttributes.domainName.Value;
  let email = event.Records[0].Sns.MessageAttributes.email.Value;
  let name = event.Records[0].Sns.MessageAttributes.name.Value;
  let submission_url = event.Records[0].Sns.MessageAttributes.submission_url.Value;
  let user_id = event.Records[0].Sns.MessageAttributes.user_id.Value;
  let assignment_id = event.Records[0].Sns.MessageAttributes.assignment_id.Value;
  let emailStatus;
    let trackEmails;
    let emailErrorStatus;
    let trackErrorEmails;
  try {
    // const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    // let domainName = event.Records[0].Sns.MessageAttributes.domainName.Value;
    // let email = event.Records[0].Sns.MessageAttributes.email.Value;
    // let name = event.Records[0].Sns.MessageAttributes.name.Value;
    // let submission_url = event.Records[0].Sns.MessageAttributes.submission_url.Value;
    // let user_id = event.Records[0].Sns.MessageAttributes.user_id.Value;
    // let assignment_id = event.Records[0].Sns.MessageAttributes.assignment_id.Value;
    // // Download release from GitHub repository
    // const githubReleaseUrl = 'https://github.com/tparikh/myrepo/archive/refs/tags/v1.0.0.zip';
    // const githubReleaseUrl = process.env.githubReleaseUrl;
    const githubReleaseUrl = submission_url;
    const releaseResponse = await axios.get(githubReleaseUrl, { responseType: 'arraybuffer' });
    const releaseData = Buffer.from(releaseResponse.data);
    // let emailStatus;
    // let trackEmails;
    // let emailErrorStatus;
    // let trackErrorEmails;

    // Store in Google Cloud Storage
    // const bucketName = process.env.GCS_BUCKET_NAME;
    // const fileName = `release-${Date.now()}.zip`;
    // const filePath = `user_${user_id}/assignment_${assignment_id}/${Date.now()}_release.zip`;
    // const bucket = storage.bucket(bucketName);
    // const file = bucket.file(filePath);
    // await file.save(releaseData);
   
    // if (submission_url.trim() === "" || releaseData.length === 0 || submission_url.trim() == "" || releaseData.length == 0 || !releaseData || !(submission_url)) {
    //   emailStatus = await sendErrorEmail(domainName, email, name);
    // } else {
      
      // const releaseResponse = await axios.get(githubReleaseUrl, { responseType: 'arraybuffer' });
      // const releaseData = Buffer.from(releaseResponse.data);
     
      const bucketName = process.env.GCS_BUCKET_NAME;
      const fileName = `release-${Date.now()}.zip`;
      const filePath = `user_${user_id}/assignment_${assignment_id}/${Date.now()}_release.zip`;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      await file.save(releaseData);
    
      // Email user the status of download
      emailStatus = await sendEmailUsingSES(domainName, email, name, submission_url, filePath, fileName);
    // }
    // Track emails sent in DynamoDB
     trackEmails = await trackEmailInDynamoDB(emailStatus, email);

    return 'Success';
  } catch (error) {
    console.error('Error:', error);
    emailErrorStatus = await sendErrorEmail(domainName, email, name);
    trackErrorEmails = await trackEmailInDynamoDB( emailErrorStatus, email);
    throw error; // Propagate the error to be logged in CloudWatch
  }
};

async function sendEmailUsingSES(domainName, email, name, submission_url,filePath,fileName) {
  const body = `Hi ${name},\n\nHere is the status of your download.\n\nThe file ${fileName} is available at ${submission_url} and this is the path ${filePath}`;
  const from = "noreply@"+ domainName;

  const emailBody = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: { Text: { Data: body } },
      Subject: { Data: "Status of your download" },  
    },
    Source: from,
  };

  try {
    const sendEmailToUser = await ses.sendEmail(emailBody).promise();
    console.log('Email sent:', sendEmailToUser);
    return 'Email sent successfully';
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

async function trackEmailInDynamoDB(emailStatus, email) {
  const emailID = email;
  const id = uuidv4();

  const dynamoDBParams = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: {
      'id':{ S: id },
      'email': { S: emailID },
      'emailStatus': { S: emailStatus },
    },
  };

  try {
    const trackEmails = await dynamoDB.putItem(dynamoDBParams).promise();
    console.log('Email tracked:', trackEmails);
    return 'Email tracked successfully';
  } catch (err) {
    console.error('Error tracking email:', err);
    throw err;
  }
}

async function sendErrorEmail(domainName, email, name) {
  const body = `Hi ${name},\n\nThere was an error processing your submission.\n\nError`;
  const from = "noreply@" + domainName;

  const emailBody = {
    Destination: { ToAddresses: [email] },
    Message: {
      Body: { Text: { Data: body } },
      Subject: { Data: "Error Processing Submission" },
    },
    Source: from,
  };

  try {
    const sendEmailToUser = await ses.sendEmail(emailBody).promise();
    console.log('Error Email sent:', sendEmailToUser);
    return 'Error Email sent successfully';
  } catch (err) {
    console.error('Error sending error email:', err);
    throw err;
  }
}