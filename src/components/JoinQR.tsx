import { QRCodeSVG } from "qrcode.react";
import { PUBLIC_URL } from "../config";

export function JoinQR() {
  if (!PUBLIC_URL) return null;
  return (
    <aside className="join-qr">
      <div className="join-qr-text">
        <h2>Join the demo!</h2>
        <p>Scan with your phone to vote with the room</p>
        <a href={PUBLIC_URL} className="join-qr-url">
          {PUBLIC_URL}
        </a>
      </div>
      <QRCodeSVG
        value={PUBLIC_URL}
        size={112}
        bgColor="#ffffff"
        fgColor="#26251e"
        includeMargin
        className="join-qr-code"
      />
    </aside>
  );
}
