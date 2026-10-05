
"use client";

import axios from "axios";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import api from "@/lib/api";
import type { User } from "@/lib/types";

type ProfileFormProps = {
  user: User;
};

function formatDateForApi(value: string) {
  if (!value) {
    return "";
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;

  return `${day}-${month}-${year}`;
}

function formatDateForInput(value?: string | null) {
  if (!value) {
    return "";
  }

  // ISO date/timestamp:
  // 1985-08-15T00:00:00Z
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T/,
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY:
  // 15-08-1985
  const dmyMatch = value.match(
    /^(\d{2})-(\d{2})-(\d{4})$/,
  );

  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;

    return `${year}-${month}-${day}`;
  }

  return "";
}
export default function ProfileForm({
  user,
}: ProfileFormProps) {
  const [firstName, setFirstName] = useState(
    user.firstName ?? "",
  );

  const [lastName, setLastName] = useState(
    user.lastName ?? "",
  );

  const [username, setUsername] = useState(
    user.username ?? "",
  );

  const [email, setEmail] = useState(
    user.email ?? "",
  );

  const [altEmail, setAltEmail] = useState(
    user.altEmail ?? "",
  );

  const [phone, setPhone] = useState(
    user.phone ?? "",
  );

  const [dateOfBirth, setDateOfBirth] = useState(
    formatDateForInput(user.dateOfBirth),
  );

  const [addressLine1, setAddressLine1] = useState(
    user.addressLine1 ?? "",
  );

  const [addressLine2, setAddressLine2] = useState(
    user.addressLine2 ?? "",
  );

  const [city, setCity] = useState(
    user.city ?? "",
  );

  const [state, setState] = useState(
    user.state ?? "",
  );

  const [pinCode, setPinCode] = useState(
    user.pinCode ?? "",
  );

  const [loading, setLoading] = useState(false);

  const [popupMessage, setPopupMessage] =
    useState("");

  const [popupType, setPopupType] = useState<
    "success" | "error" | ""
  >("");

  function showPopup(
    message: string,
    type: "success" | "error",
  ) {
    setPopupMessage(message);
    setPopupType(type);
  }

  function closePopup() {
    setPopupMessage("");
    setPopupType("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    closePopup();
    setLoading(true);

    try {

    const apiDateOfBirth = formatDateForApi(dateOfBirth);

console.log("Frontend DOB:", dateOfBirth);
console.log("API DOB:", apiDateOfBirth);
      await api.patch("/auth/me", {
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  username: username.trim(),
  email: email.trim(),
  altEmail: altEmail.trim(),
  phone: phone.trim(),
  dateOfBirth: formatDateForApi(dateOfBirth),
  addressLine1: addressLine1.trim(),
  addressLine2: addressLine2.trim(),
  city: city.trim(),
  state: state.trim(),
  pinCode: pinCode.trim(),
});
      showPopup(
        "Profile updated successfully.",
        "success",
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showPopup(
          error.response?.data?.error ??
            "Unable to update profile",
          "error",
        );
      } else {
        showPopup(
          "Unable to connect to the server",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-4 sm:p-5 lg:p-6"
      >
        {/* Personal Information */}

        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Personal information
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              id="firstName"
              label="First name"
              value={firstName}
              autoComplete="given-name"
              onChange={(event) =>
                setFirstName(event.target.value)
              }
            />

            <ProfileField
              id="lastName"
              label="Last name"
              value={lastName}
              autoComplete="family-name"
              onChange={(event) =>
                setLastName(event.target.value)
              }
            />

            <ProfileField
              id="username"
              label="Username"
              value={username}
              autoComplete="username"
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />

            <ProfileField
              id="phone"
              label="Phone"
              type="tel"
              value={phone}
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />

            <ProfileField
              id="email"
              label="Email"
              type="email"
              value={email}
              autoComplete="email"
              inputMode="email"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <ProfileField
              id="altEmail"
              label="Alternative email"
              type="email"
              value={altEmail}
              autoComplete="email"
              inputMode="email"
              onChange={(event) =>
                setAltEmail(event.target.value)
              }
            />

            <ProfileField
              id="dateOfBirth"
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) =>
                setDateOfBirth(event.target.value)
              }
            />
          </div>
        </section>

        {/* Divider */}

        <div className="my-6 h-px bg-white/50" />

        {/* Address */}

        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Address
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ProfileField
                id="addressLine1"
                label="Address line 1"
                value={addressLine1}
                autoComplete="address-line1"
                onChange={(event) =>
                  setAddressLine1(event.target.value)
                }
              />
            </div>

            <div className="sm:col-span-2">
              <ProfileField
                id="addressLine2"
                label="Address line 2"
                value={addressLine2}
                autoComplete="address-line2"
                onChange={(event) =>
                  setAddressLine2(event.target.value)
                }
              />
            </div>

            <ProfileField
              id="city"
              label="City"
              value={city}
              autoComplete="address-level2"
              onChange={(event) =>
                setCity(event.target.value)
              }
            />

            <ProfileField
              id="state"
              label="State"
              value={state}
              autoComplete="address-level1"
              onChange={(event) =>
                setState(event.target.value)
              }
            />

            <ProfileField
              id="pinCode"
              label="PIN code"
              value={pinCode}
              autoComplete="postal-code"
              inputMode="numeric"
              onChange={(event) =>
                setPinCode(event.target.value)
              }
            />
          </div>
        </section>

        {/* Actions */}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Backend message popup */}

      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close message"
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
            onClick={closePopup}
          />

          <div
            role="alert"
            aria-live="polite"
            className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-[0_20px_50px_rgba(31,38,135,0.16)] backdrop-blur-2xl ${
              popupType === "error"
                ? "border-red-200/80 bg-red-50/75 text-red-800"
                : "border-white/80 bg-white/75 text-zinc-800"
            }`}
          >
            <div className="flex items-start gap-3">
              {popupType === "error" && (
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600">
                  !
                </div>
              )}

              <p className="min-w-0 flex-1 text-sm leading-6">
                {popupMessage}
              </p>

              <button
                type="button"
                onClick={closePopup}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:bg-black/5 hover:text-zinc-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type ProfileFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function ProfileField({
  id,
  label,
  type = "text",
  value,
  autoComplete,
  inputMode,
  onChange,
}: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={onChange}
        className="h-11 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
      />
    </div>
  );
}
