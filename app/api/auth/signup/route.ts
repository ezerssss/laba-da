import { NextRequest, NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import serverDb from "@/app/firebase/db";
import { Timestamp } from "firebase-admin/firestore";
import { getErrorMessage } from "@/lib/error";
import { SignUpRequestSchema, UserDataType } from "@/app/types/server/auth";
import { LaundryShopType } from "@/app/types/server/shop";

const userCollectionRef = serverDb.collection("users");
const laundryShopsCollectionRef = serverDb.collection("laundryShops");

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = SignUpRequestSchema.safeParse(body);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { message: error },
      { status: StatusCodes.BAD_REQUEST }
    );
  }

  try {
    const { laundryShopName, laundryShopImage, numMachines, ...user } = data;

    // Create laundry shop profile
    const laundryShopDocumentRef = await laundryShopsCollectionRef.add({});
    const laundryShopID = laundryShopDocumentRef.id;

    const laundryProfile: LaundryShopType = {
      shopID: laundryShopID,
      name: laundryShopName,
      imageURL: laundryShopImage,
      numMachines,
      dateCreated: Timestamp.now(),
      dateModified: Timestamp.now(),
    };

    await laundryShopDocumentRef.set(laundryProfile);

    // Create user profile
    const userProfile: UserDataType = {
      ...user,
      shopID: laundryShopID,
      dateCreated: Timestamp.now(),
    };

    await userCollectionRef.doc(user.uid).set(userProfile);

    return NextResponse.json(
      { message: "Successfully created account." },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: getErrorMessage(error) },
      {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        statusText: getErrorMessage(error),
      }
    );
  }
}
