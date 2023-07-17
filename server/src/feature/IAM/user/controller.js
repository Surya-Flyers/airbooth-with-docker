import { throwError, logError } from "../../../services/error.js";
import { sendMail } from "../../../services/mail.js";
import { makeRandomId } from "../../../utils/index.js";
import {
  createInspector,
  createRootInspector,
  findInspectorByEmail,
  findInspectorProfilesByUserId,
  getAllInspectorsProfileByPagination,
} from "../../inspector/repository.js";
import {
  createClaim,
  createClaimIfNotExist,
  getAllClaimByIds,
  getClaimByValue,
} from "../claim/repository.js";
import {
  createIamItemIfNotExist,
  getAllIamItemsByIds,
} from "../item/repository.js";
import {
  changeIamUserPasswordStatus,
  createInspectorIamUser,
  createRootAdminIamUser,
  findIamUserByUserId,
  getAllIamInspectorsProfileByIds,
  getAllIamUsersByPagination,
  setIamUserNewPassword,
  updateIamUserClaims,
} from "./repository.js";
import IamUserSchema from "./schema.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const getPassportDetailsThroughScan = async () => {};
const saveTouristPassportDetails = async () => {};
const verifyEnteredPassportDetails = async () => {};

// import nodemailer = require("nodemailer");
// import {createTransport} from ""
import { createTransport } from "nodemailer";
import { createJwtToken, verifyToken } from "../../../services/auth.js";
import { PASSWORD_STATUS_TYPES } from "../../../helpers/constants.js";
export async function sendMaile(request, response) {
  // user: "frederik.runolfsdottir@ethereal.email",
  // pass: "cnAuCgmVj9xDDews2g",
  console.log("request : ", request.data);
  try {
    // const { message } = request.body;
    const transporter = createTransport({
      host: "smtp.ethereal.email",
      // host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "frederik.runolfsdottir@ethereal.email",
        pass: "cnAuCgmVj9xDDews2g",
      },
    });

    const info = await transporter.sendMail({
      from: "frederik.runolfsdottir@ethereal.email", // sender address
      to: "surya.b@flyerssoft.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello boss", // plain text body
      html: `<b>some</b>`, // html body
    });

    console.log("Mail : ", info);
    response.send("Success ");
  } catch (error) {
    console.error(error);
    response.status(500).send({ error: error });
  }
}

export async function createRootUser_controller(request, response) {
  console.log("createRootUser  ");
  try {
    const { name, dob, email, phoneNumber } = request.body;

    console.log("request.body : ", request.body);

    const getClaimByValueResult = await getClaimByValue({ value: "ROOT-USER" });

    console.log("getClaimByValueResult : ", getClaimByValueResult);

    if (getClaimByValueResult?._id) {
      throwError("Root user already exist");
    }

    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (inspectorProfile?._id) {
      throwError("Root user already exist");
    }

    const userProfile = await createRootInspector({
      name,
      dob,
      email,
      phoneNumber,
    });
    console.log("userProfile : ", userProfile);

    if (!(userProfile && userProfile._id)) {
      throwError("unable to create user profile");
    }

    // get / create app item if not exist
    const itemResult = await createIamItemIfNotExist({
      name: "App",
      value: "APP",
      description: "Access to Entire Application",
    });
    console.log("itemResult : ", itemResult);

    const objectIdIamItem = mongoose.Types.ObjectId(itemResult._id);

    // get / create root-user claim if not exist
    const claimResult = await createClaim({
      name: "Root user",
      value: "ROOT-USER",
      itemsPermission: [
        {
          itemId: objectIdIamItem,
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      ],
      description: "Have access to entire application",
    });
    console.log("claimResult : ", claimResult);

    const objectIdClaim = mongoose.Types.ObjectId(claimResult._id);
    const code = makeRandomId(6);

    const iamUser = await createRootAdminIamUser({
      userId: userProfile._id,
      claims: [objectIdClaim],
      code: code,
    });

    console.log("iamUser : ", iamUser);

    const sendMailResult = await sendMail({
      to: "surya.b@flyerssoft.com", // list of receivers
      subject: `Verify code ${code}`, // Subject line
      text: `Vaa mamee ${name}`, // plain text body
      html: `<b>access code : ${code}</b>`, // html body
    });

    console.log("sendMailResult : ", sendMailResult);
    // send mail go admin
    response.send({
      status: "success",
      message: "Access code has sent through mail, Kindly check it",
      code: code,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function verifyRootUserAndSetNewPassword_controller(
  request,
  response
) {
  console.log("verifyRootUserAndSetNewPassword  ");
  try {
    const { email, code, newPassword } = request.body;

    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (!inspectorProfile?._id) {
      throwError("Root user does not exist");
    }

    const rootIamUser = await findIamUserByUserId({
      userId: inspectorProfile?._id,
    });

    if (
      !rootIamUser &&
      !rootIamUser?._id &&
      rootIamUser?.password?.status !== "UN_VERIFIED"
    ) {
      throwError("Something went wrong");
    }

    if (rootIamUser?.password?.code !== code) {
      throwError("Invalid access code");
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 12);

    const setPasswordResult = await setIamUserNewPassword({
      iamUserId: rootIamUser._id,
      password: encryptedPassword,
    });

    console.log("setPasswordResult : ", setPasswordResult);
    // send mail go admin
    response.send({
      status: "success",
      message: "successfully setted password",
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function loginIamUser_controller(request, response) {
  try {
    const { email, password } = request.body;
    console.log("request.headers.auth : ", request.headers.auth);

    const inspectorProfile = await findInspectorByEmail({ email });

    if (!inspectorProfile?._id) {
      throwError("User does not exist, please signup");
    }

    const rootIamUser = await findIamUserByUserId({
      userId: inspectorProfile?._id,
    });

    if (
      !rootIamUser &&
      !rootIamUser?._id &&
      rootIamUser?.password?.status !== "VERIFIED"
    ) {
      throwError("Something went wrong");
    }

    const validPassword = await bcrypt.compare(
      password,
      rootIamUser.password.value
    );

    if (validPassword === false) {
      throwError("Invalid password or Email");
    }

    // get all claims
    const userClaims = rootIamUser.claims;
    let claimsData = {};
    if (userClaims && userClaims.length > 0) {
      claimsData = await getAllClaimByIds({ claimIds: userClaims });
      console.log("claimsData : ", claimsData);

      // get Items permissions
      for (const { itemsPermission } of claimsData) {
        const _itemsPermissionIds = itemsPermission.map((item) => item._id);
        const _itemsPermissionsData = await getAllIamItemsByIds({
          itemIds: _itemsPermissionIds,
        });
        itemsPermission.forEach((_item) => {
          const _itemData = _itemsPermissionsData.find(
            (data) => data._id === _item._id
          );
          _item = {
            ..._item,
            ..._itemData,
          };
        });
      }
    }

    const token = await createJwtToken({
      userId: inspectorProfile._id,
      email: email,
      claims: claimsData,
      status: rootIamUser?.password?.status,
    });

    const isVerified = await verifyToken({ token: token });

    console.log("isVerified : ", isVerified);
    // send mail go admin
    response.send({
      status: "success",
      token: token,
      claims: claimsData,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function createInspectorAccount_controller(request, response) {
  try {
    const {
      name,
      dob,
      email,
      phoneNumber,
      reportingManager,
      externalId,
      employeeId,
    } = request.body;

    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (inspectorProfile?._id) {
      throwError("User already exist");
    }

    const userProfile = await createInspector({
      name,
      dob,
      email,
      phoneNumber,
      reportingManager,
      externalId,
      employeeId,
    });
    console.log("userProfile : ", userProfile);

    if (!(userProfile && userProfile._id)) {
      throwError("unable to create user profile");
    }

    const code = makeRandomId(6);

    const iamUser = await createInspectorIamUser({
      userId: userProfile._id,
      code: code,
    });

    console.log("iamUser : ", iamUser);

    const sendMailResult = await sendMail({
      to: "surya.b@flyerssoft.com", // list of receivers
      subject: `Verify code ${code}`, // Subject line
      text: `Vaa mamee ${name}`, // plain text body
      html: `<b>access code : ${code}</b>`, // html body
    });

    console.log("sendMailResult : ", sendMailResult);
    // send mail go admin
    response.send({
      status: "success",
      message: "Access code has sent through mail, Kindly check it",
      code: code,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function verifyInspectorAccountAndSetNewPassword_controller(
  request,
  response
) {
  try {
    const email = request.params.email;
    const { code, newPassword } = request.body;

    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (!inspectorProfile?._id) {
      throwError("User does not exist");
    }

    const rootIamUser = await findIamUserByUserId({
      userId: inspectorProfile?._id,
    });

    console.log("rootIamUser : ", rootIamUser);
    if (
      !rootIamUser &&
      !rootIamUser?._id &&
      rootIamUser?.password?.status !== "UN_VERIFIED"
    ) {
      throwError("Something went wrong");
    }

    if (rootIamUser?.password?.code !== code) {
      throwError("Invalid access code");
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 12);

    const setPasswordResult = await setIamUserNewPassword({
      iamUserId: rootIamUser._id,
      password: encryptedPassword,
    });

    console.log("setPasswordResult : ", setPasswordResult);
    // send mail go admin
    response.send({
      status: "success",
      message: "successfully setted password",
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function resetInspectorAccountPassword_controller(
  request,
  response
) {
  try {
    const email = request.params.email;

    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (!inspectorProfile?._id) {
      throwError("User does not exist");
    }

    const iamUser = await findIamUserByUserId({
      userId: inspectorProfile?._id,
    });

    if (iamUser.password.status !== PASSWORD_STATUS_TYPES.VERIFIED) {
      throwError(
        `Unable to reset password, current password status ${iamUser.password.status} `
      );
    }

    const code = makeRandomId(6);
    const newGeneratedPassword = makeRandomId(10);
    const encryptedPassword = await bcrypt.hash(newGeneratedPassword, 12);

    const setIamUserNewPasswordResult = await setIamUserNewPassword({
      iamUserId: iamUser._id,
      password: encryptedPassword,
    });
    // const changeIamUserPasswordStatus_result =
    //   await changeIamUserPasswordStatus({
    //     iamUserId: iamUser._id,
    //     status: PASSWORD_STATUS_TYPES.RESET,
    //     code: code,
    //   });

    console.log("setIamUserNewPasswordResult : ", setIamUserNewPasswordResult);

    // const sendMailResult = await sendMail({
    //   to: "surya.b@flyerssoft.com", // list of receivers
    //   subject: `Verify code ${code}`, // Subject line
    //   text: `Vaa mamee ${name}`, // plain text body
    //   html: `<b>access code : ${code}</b>`, // html body
    // });

    // console.log("sendMailResult : ", sendMailResult);
    // send mail go admin
    response.send({
      status: "success",
      message: "successfully rested password & sent code to mail",
      password: newGeneratedPassword,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function updateClaimsOfInspector_controller(request, response) {
  try {
    const email = request.params.email;
    const { claims } = request.body;
    const inspectorProfile = await findInspectorByEmail({ email });
    console.log("inspectorProfile : ", inspectorProfile);

    if (!inspectorProfile?._id) {
      throwError("User does not exist");
    }

    const iamUser = await findIamUserByUserId({
      userId: inspectorProfile?._id,
    });

    const HAS_DUPLICATE_CLAIMS = new Set(claims).size !== claims.length;

    if (HAS_DUPLICATE_CLAIMS === true) {
      throwError("Duplicate claims");
    }

    // find claims
    const getAllClaimByIdsResult = await getAllClaimByIds({ claimIds: claims });

    if (getAllClaimByIdsResult.length !== claims.length) {
      throwError("Invalid Claim Ids Present");
    }

    const updateIamUserClaimsResult = await updateIamUserClaims({
      iamUserId: iamUser._id,
      claims: claims,
    });
    response.send({
      status: "success",
      data: updateIamUserClaimsResult,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function getAllInspectorsIamProfile_controller(request, response) {
  try {
    const { size, lastRecordUpdatedDate } = request.body;

    const getAllInspectorsProfileByPaginationResult =
      await getAllInspectorsProfileByPagination({
        size: size,
        updatedOnBefore: lastRecordUpdatedDate,
      });

    const inspectorsIamIds = getAllInspectorsProfileByPaginationResult.map(
      (inspectorProfile) => inspectorProfile._id
    );

    const getAllIamInspectorsProfileByIdsResult =
      await getAllIamInspectorsProfileByIds({ ids: inspectorsIamIds });

    console.log(
      "getAllIamInspectorsProfileByIdsResult : ",
      getAllIamInspectorsProfileByIdsResult
    );

    if (
      getAllIamInspectorsProfileByIdsResult.length !==
      getAllInspectorsProfileByPaginationResult.length
    ) {
      throwError("Some users does not exist");
    }

    let result = [];

    for (let inspectorProfile of getAllInspectorsProfileByPaginationResult) {
      inspectorProfile = inspectorProfile.toObject();
      const inspectorIamProfile = getAllIamInspectorsProfileByIdsResult
        .find(
          (iamProfile) =>
            String(iamProfile.userId) === String(inspectorProfile._id)
        )
        ?.toObject();
      console.log("---------");
      const _result = { ...inspectorIamProfile, ...inspectorProfile };
      console.log("inspectorIamProfile : ", inspectorIamProfile);
      console.log("inspectorProfile : ", inspectorProfile);
      console.log("---------\n\n");
      // const createdAt = inspectorProfile.createdAt;
      // const updatedAt = inspectorProfile.updatedAt;
      // inspectorProfile = {
      //   ...inspectorIamProfile,
      //   createdAt: createdAt,
      //   updatedAt: updatedAt,
      // };

      result.push({ ...inspectorIamProfile, ...inspectorProfile });
    }

    response.send({
      status: "success",
      data: result,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
