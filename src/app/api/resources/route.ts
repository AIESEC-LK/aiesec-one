import clientPromise from "@/lib/mongodb";
import Resource from "@/models/Resource";
import { COLLECTIONS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";
import {
  createdResponse,
  errorResponse,
  successResponse
} from "@/util/apiUtils";
import { ResourceRequest } from "@/types/ResourceRequest";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const officeId = req.nextUrl.searchParams.get("officeId");
  console.log("OFFICE ID 🎃", officeId);
  try {
    const db = (await clientPromise).db();

    const resources = await db
      .collection(COLLECTIONS.RESOURCES)
      .find({
        officeId: officeId
      })
      .toArray();

    return successResponse(SUCCESS_MESSAGES.RESOURCES_FETCHED, resources);
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.RESOURCES_FETCH_FAILED, error);
  }
}

export async function POST(req: Request) {
  const { resource, officeId } = await req.json();

  try {
    const db = (await clientPromise).db();

    const newResource = new Resource({
      title: resource.title,
      description: resource.description,
      originalUrl: resource.originalUrl,
      shortLink: resource.shortLink,
      functions: resource.functions.split(","),
      keywords: resource.keywords.split(","),
      officeId: officeId
    });

    const result = await db
      .collection(COLLECTIONS.RESOURCES)
      .insertOne(newResource);

    return createdResponse(SUCCESS_MESSAGES.RESOURCE_CREATED, {
      _id: result.insertedId
    });
  } catch (error) {
    console.error(error);
    return errorResponse(ERROR_MESSAGES.RESOURCE_CREATE_FAILED, error);
  }
}
