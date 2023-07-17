import { createTransport } from "nodemailer";

export async function sendMail({ from, to, subject, text, html }) {
  const transporter = createTransport({
    host: "smtp.ethereal.email",
    // host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "frederik.runolfsdottir@ethereal.email",
      pass: "cnAuCgmVj9xDDews2g",
    },
  });

  const result = await transporter.sendMail({
    from: "frederik.runolfsdottir@ethereal.email", // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body
  });

  return result;
}
