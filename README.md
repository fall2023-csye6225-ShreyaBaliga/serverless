# Serverless Project Code
# Lambda Function for GitHub Release Download and Notification
This Lambda function is designed to be triggered by an SNS (Simple Notification Service) notification. Its primary responsibilities include:

# 1 GitHub Release Download and Storage in Google Cloud Storage Bucket
Upon invocation, the Lambda function will download the specified release from the GitHub repository. The downloaded release will then be stored in a designated Google Cloud Storage (GCS) Bucket, ensuring secure and scalable storage of the release artifacts.

# 2 Email Notification to User
After successfully downloading and storing the release, the Lambda function will send an email to the user providing the status of the download. This email notification serves to keep the user informed about the progress and outcome of the release retrieval process.

# 3 Email Tracking in DynamoDB
To maintain a record of the emails sent, the Lambda function will utilize DynamoDB, a NoSQL database service provided by AWS. Each email sent will be tracked and logged in DynamoDB, allowing for easy monitoring and auditing of communication activities.

# Configuration
To use this Lambda function effectively, ensure the following:

# GitHub Access: 
Provide necessary access credentials or tokens to allow the Lambda function to access the GitHub repository.

# Google Cloud Storage Credentials: 
Set up the required credentials for the Lambda function to interact with the specified Google Cloud Storage Bucket.

# Email Configuration: 
Configure the Lambda function with the necessary email server details to enable email notifications. This may include SMTP server information, sender/receiver email addresses, etc.

# DynamoDB Setup: 
Create a DynamoDB table to store email tracking information. Configure the Lambda function with the appropriate permissions to read and write to this table.

# Deployment
Deploy the Lambda function in your AWS environment and configure the SNS trigger to ensure timely execution upon notification. Monitor the associated AWS CloudWatch logs for insights into the function's execution and any potential issues.