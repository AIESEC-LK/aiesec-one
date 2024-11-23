import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import { isValidId } from "@/util/dataUtils";
import {
  COLLECTIONS,
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES
} from "@/lib/constants";
import { errorResponse, successResponse } from "@/util/apiUtils";
import { ResourceRequest } from "@/types/ResourceRequest";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Extract the dynamic parameter (id) from the path parameter
    const { id } = context.params;

    if (!isValidId(id)) {
      return errorResponse(
        ERROR_MESSAGES.RESOURCE_ID_INVALID,
        null,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const db = (await clientPromise).db();

    // Convert the dynamic parameter to an ObjectId and query the database
    const resource = await db
      .collection(COLLECTIONS.RESOURCES)
      .findOne({ _id: new ObjectId(id) });

    if (resource) {
      return successResponse(SUCCESS_MESSAGES.RESOURCE_FETCHED, resource);
    } else {
      return errorResponse(
        ERROR_MESSAGES.RESOURCE_NOT_FOUND,
        null,
        HTTP_STATUS.NOT_FOUND
      );
    }
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.RESOURCES_FETCH_FAILED, error);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const resourceRequest: ResourceRequest = await req.json();

    if (!isValidId(id)) {
      return errorResponse(
        ERROR_MESSAGES.RESOURCE_ID_INVALID,
        null,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const db = (await clientPromise).db();

    // Update the document
    const result = await db.collection(COLLECTIONS.RESOURCES).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: resourceRequest.title,
          description: resourceRequest.description,
          originalUrl: resourceRequest.originalUrl,
          shortLink: resourceRequest.shortLink,
          functions: resourceRequest.functions,
          keywords: resourceRequest.keywords
        }
      }
    );

    if (result.modifiedCount > 0) {
      return successResponse(SUCCESS_MESSAGES.RESOURCE_UPDATED, { _id: id });
    } else {
      return errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.RESOURCE_UPDATE_FAILED, error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    if (!isValidId(id)) {
      return errorResponse(
        ERROR_MESSAGES.RESOURCE_ID_INVALID,
        null,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const db = (await clientPromise).db();

    // Delete the document
    const result = await db
      .collection(COLLECTIONS.RESOURCES)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      return successResponse(SUCCESS_MESSAGES.RESOURCE_DELETED);
    } else {
      return errorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.RESOURCE_DELETE_FAILED, error);
  }
}
