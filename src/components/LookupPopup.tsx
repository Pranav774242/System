import { useState } from "react";
import type { LookupTypeForm } from "@/lib/lookup-data";

type LookupTypePopupProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LookupTypeForm) => void;
};

/* =========================
   Lookup Options
========================= */

const ROLE_OPTIONS = [
  { key: "Admin", value: 1 },
  { key: "Maker", value: 2 },
  { key: "Checker", value: 3 },
  { key: "Viewer", value: 4 },
];

const DESIGNATION_OPTIONS = [
  { key: "Manager", value: 1 },
  { key: "Officer", value: 2 },
  { key: "Clerk", value: 3 },
  { key: "Executive", value: 4 },
];

const STATUS_OPTIONS = [
  { key: "Active", value: 1 },
  { key: "Inactive", value: 2 },
  { key: "Locked", value: 3 },
];

/* =========================
   Dummy API
========================= */

async function dummyCreateLookupTypeApi(data: LookupTypeForm) {
  console.log("=================================");
  console.log("DUMMY API HIT");
  console.log("=================================");

  console.log("API URL:");
  console.log("/api/v1/administration/lookup-types");

  console.log("Method:");
  console.log("POST");

  console.log("Role sent as number:", data.role);
  console.log("Designation sent as number:", data.designation);
  console.log("Status sent as number:", data.status);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dummyResponse = {
    success: true,
    message: "Lookup type created successfully",
    data: data,
  };

  console.log("Dummy API Response:");
  console.log(dummyResponse);

  console.log("=================================");

  return dummyResponse;
}

export function LookupTypePopup({
  open,
  onClose,
  onSubmit,
}: LookupTypePopupProps) {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupName, setLookupName] = useState("");

  const [role, setRole] = useState<number | "">("");
  const [designation, setDesignation] = useState<number | "">("");
  const [status, setStatus] = useState<number | "">("");

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* =========================
       Validation
    ========================= */

    const trimmedLookupCode = lookupCode.trim();
    const trimmedLookupName = lookupName.trim();

    if (!trimmedLookupCode) {
      console.log("Lookup Code is required");
      return;
    }

    if (!trimmedLookupName) {
      console.log("Lookup Name is required");
      return;
    }

    if (role === "") {
      console.log("Role is required");
      return;
    }

    if (designation === "") {
      console.log("Designation is required");
      return;
    }

    if (status === "") {
      console.log("Status is required");
      return;
    }

    /* =========================
       Final Payload
       
       IMPORTANT:
       Dropdown displays key
       Payload sends numeric value
    ========================= */

    const data = {
      lookupCode: trimmedLookupCode,
      lookupName: trimmedLookupName,

      role: Number(role),
      designation: Number(designation),
      status: Number(status),
    } as LookupTypeForm;

    /* =========================
       Console Payload
    ========================= */

    console.log("=================================");
    console.log("LOOKUP TYPE FORM SUBMITTED");
    console.log("=================================");

    console.log("Lookup Code:", data.lookupCode);
    console.log("Lookup Name:", data.lookupName);

    console.log("Role Number:", data.role);
    console.log("Designation Number:", data.designation);
    console.log("Status Number:", data.status);

    /* =========================
       Dummy API Hit
    ========================= */

    await dummyCreateLookupTypeApi(data);

    /* =========================
       Parent Callback
    ========================= */

    onSubmit(data);

    /* =========================
       Reset Form
    ========================= */

    setLookupCode("");
    setLookupName("");
    setRole("");
    setDesignation("");
    setStatus("");
  }

  function handleCancel() {
    setLookupCode("");
    setLookupName("");
    setRole("");
    setDesignation("");
    setStatus("");

    onClose();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-[#172033]/40
        px-4
        py-6
        backdrop-blur-[2px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="
          relative
          w-full
          max-w-[620px]
          overflow-hidden
          rounded-2xl
          border
          border-[#E2E6EE]
          bg-white
          shadow-[0_20px_50px_rgba(23,32,51,0.16)]
        "
      >
        {/* =========================
            Header
        ========================= */}

        <div
          className="
            flex
            min-h-[64px]
            items-center
            justify-between
            border-b
            border-[#E2E6EE]
            bg-white
            px-6
            py-4
          "
        >
          <div>
            <h2
              className="
                text-[18px]
                font-semibold
                leading-6
                text-[#172033]
              "
            >
              Lookup Type Management
            </h2>

            <p className="mt-1 text-xs text-[#667085]">
              Create a new lookup type
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-xl
              leading-none
              text-[#667085]
              transition
              hover:bg-[#F7F9FC]
              hover:text-[#172033]
              focus:outline-none
              focus:ring-2
              focus:ring-[#213B7A]/20
            "
          >
            ×
          </button>
        </div>

        {/* =========================
            Form
        ========================= */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6 sm:px-7">
            {/* Lookup Code */}

            <div className="space-y-2">
              <label
                htmlFor="popupLookupCode"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
                "
              >
                Lookup Code
              </label>

              <input
                id="popupLookupCode"
                type="text"
                value={lookupCode}
                onChange={(event) => setLookupCode(event.target.value)}
                placeholder="Enter lookup code"
                // readOnly
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-[#F7F9FC]
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  placeholder:text-[#98A2B3]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              />
            </div>

            {/* Lookup Name */}

            <div className="space-y-2">
              <label
                htmlFor="popupLookupName"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
                "
              >
                Lookup Name
              </label>

              <input
                id="popupLookupName"
                type="text"
                value={lookupName}
                onChange={(event) => setLookupName(event.target.value)}
                placeholder="Enter lookup name"
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-white
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  placeholder:text-[#98A2B3]
                  hover:border-[#C8CED9]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              />
            </div>

            {/* =========================
                Role
            ========================= */}

            <div className="space-y-2">
              <label
                htmlFor="popupRole"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
                "
              >
                Role
              </label>

              <select
                id="popupRole"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-white
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  hover:border-[#C8CED9]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              >
                <option value="">Select Role</option>

                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.key}
                  </option>
                ))}
              </select>
            </div>

            {/* =========================
                Designation
            ========================= */}

            <div className="space-y-2">
              <label
                htmlFor="popupDesignation"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
                "
              >
                Designation
              </label>

              <select
                id="popupDesignation"
                value={designation}
                onChange={(event) =>
                  setDesignation(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-white
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  hover:border-[#C8CED9]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              >
                <option value="">Select Designation</option>

                {DESIGNATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.key}
                  </option>
                ))}
              </select>
            </div>

            {/* =========================
                Status
            ========================= */}

            <div className="space-y-2">
              <label
                htmlFor="popupStatus"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
                "
              >
                Status
              </label>

              <select
                id="popupStatus"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-white
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  hover:border-[#C8CED9]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              >
                <option value="">Select Status</option>

                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.key}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================
              Footer
          ========================= */}

          <div
            className="
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-[#E2E6EE]
              bg-[#F7F9FC]
              px-6
              py-4
              sm:px-7
            "
          >
            <button
              type="button"
              onClick={handleCancel}
              className="
                inline-flex
                h-10
                min-w-[92px]
                items-center
                justify-center
                rounded-lg
                border
                border-[#E2E6EE]
                bg-white
                px-4
                text-sm
                font-medium
                text-[#667085]
                transition
                hover:bg-[#F7F9FC]
                hover:text-[#172033]
                focus:outline-none
                focus:ring-2
                focus:ring-[#213B7A]/20
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                inline-flex
                h-10
                min-w-[92px]
                items-center
                justify-center
                rounded-lg
                bg-[#213B7A]
                px-4
                text-sm
                font-medium
                text-white
                shadow-sm
                transition
                hover:bg-[#1B3269]
                focus:outline-none
                focus:ring-2
                focus:ring-[#213B7A]/20
              "
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
