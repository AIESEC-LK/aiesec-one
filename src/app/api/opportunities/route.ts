import clientPromise from "@/lib/mongodb";
import Opportunity from "@/models/Opportunity";
import {
  COLLECTIONS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES
} from "@/lib/constants";
import {
  createdResponse,
  errorResponse,
  successResponse
} from "@/util/apiUtils";
import { r2Client } from "@/lib/r2Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { uuidV4 } from "mongodb/src/utils";

export async function GET() {
  try {
    const db = (await clientPromise).db();

    const opportunities = await db
      .collection(COLLECTIONS.OPPORTUNITIES)
      .find({})
      .toArray();

    return successResponse(
      SUCCESS_MESSAGES.OPPORTUNITIES_FETCHED,
      opportunities
    );
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.OPPORTUNITIES_FETCH_FAILED, error);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const data = formData.get("data");
    let opportunityRequest = null;

    if (data) {
      try {
        opportunityRequest = JSON.parse(data.toString());
      } catch (error) {
        console.error("Error parsing opportunityRequest data:", error);
        return errorResponse(
          ERROR_MESSAGES.OPPORTUNITY_CREATE_FAILED,
          error,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const uniqueId = uuidV4().toString();
    const db = (await clientPromise).db();

    const newOpportunity = new Opportunity({
      title: opportunityRequest.title,
      description: opportunityRequest.description,
      originalUrl: opportunityRequest.originalUrl,
      shortLink: opportunityRequest.shortLink,
      coverImageUrl: opportunityRequest?.coverImage
        ? await uploadFileToR2(file, uniqueId)
        : null
    });

    const result = await db
      .collection(COLLECTIONS.OPPORTUNITIES)
      .insertOne(newOpportunity);

    return createdResponse(SUCCESS_MESSAGES.OPPORTUNITY_CREATED, {
      _id: result.insertedId
    });
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.OPPORTUNITY_CREATE_FAILED, error);
  }
}

// async function getSignedUrl(file: File, uniqueId: string) {
//   try {
//     console.log("Generating an upload URL!");
//
//     const uuid = uuidV4().toString();
//
//     const signedUrl = await getSignedUrl(
//       r2Client,
//       new PutObjectCommand({
//         Bucket: process.env.R2_BUCKET_NAME,
//         Key: uuid
//       }),
//       {expiresIn: 60}
//     );
//
//     console.log("Success generating upload URL!");
//     return {signedUrl, uuid};
//
//   } catch (err) {
//     console.error("Error generating upload URL:", err);
//     return null;
//   }
// }

async function uploadFileToR2(file: File, uniqueId: string) {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const key = `${uniqueId}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: file.type
    });

    await r2Client.send(command);
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
}
