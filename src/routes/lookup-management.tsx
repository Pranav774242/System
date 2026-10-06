import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LookupTypePopup } from "@/components/LookupPopup";
import { initialLookupData, type LookupItem, type LookupTypeForm } from "@/lib/lookup-data";

export const Route = createFileRoute("/lookup-management")({
  head: () => ({
    meta: [
      {
        title: "Lookup Management — System Administrator Panel",
      },
    ],
  }),

  component: LookupManagementPage,
});

function LookupManagementPage() {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupName, setLookupName] = useState("");

  const [lookupData, setLookupData] = useState<LookupItem[]>(initialLookupData);

  const [popupOpen, setPopupOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = {
      lookupCode: lookupCode.trim(),
      lookupName: lookupName.trim(),
    };

    if (!data.lookupCode) {
      console.log("Lookup Code is required");
      return;
    }

    if (!data.lookupName) {
      console.log("Lookup Name is required");
      return;
    }

    console.log("Main Lookup Data:", data);
  }

  function handleCancel() {
    setLookupCode("");
    setLookupName("");
  }

  function handlePopupSubmit(data: LookupTypeForm) {
    console.log("Popup Submitted:", data);

    /*
     * For now we are only printing the data.
     *
     * Later your API call can be placed here.
     */

    const newLookup: LookupItem = {
      id: lookupData.length + 1,
      lookupCode: data.lookupCode,
      lookupDescription: data.lookupName,
    };

    setLookupData((currentData) => [...currentData, newLookup]);

    setPopupOpen(false);
  }

  return (
    <AppShell title="Lookup Management" subtitle="Manage lookup types and lookup sub types">
      <div className="space-y-6">
        {/* Main Card */}
        <section className="rounded-2xl border border-[#E2E6EE] bg-white shadow-[0_2px_10px_rgba(23,32,51,0.04)]">
          {/* Card Header */}
          <div className="flex flex-col gap-4 border-b border-[#E2E6EE] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
            <div>
              <h2 className="text-[18px] font-semibold leading-6 text-[#172033]">
                Lookup Sub Type Management
              </h2>

              <p className="mt-1 text-sm text-[#667085]">
                Manage lookup codes and lookup descriptions
              </p>
            </div>
            {/* Existing Lookup Type action */}
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                rounded-lg
                border
                border-[#E2E6EE]
                bg-accent
                px-4
                text-sm
                font-medium
                text-[#213B7A]
                transition
                duration-150
                focus:outline-none
                focus:ring-2
                focus:ring-[#213B7A]/20
              "
            >
              Add Lookup
              <Plus className="size-4" />
            </button>
          </div>
          {/* bg-white
                hover:border-[#213B7A]
                hover:bg-[#F7F9FC] */}

          {/* Form Section */}
          <div className="px-6 py-6 lg:px-7">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Lookup Code */}
                {/*
                 */}
                <div className="space-y-2">
                  <label
                    htmlFor="lookupSearch"
                    className="block text-[13px] font-medium text-[#667085]"
                  >
                    Search Lookup
                  </label>

                  <input
                    id="lookupSearch"
                    type="text"
                    value={lookupCode || lookupName}
                    onChange={(event) => {
                      setLookupCode(event.target.value);
                      setLookupName(event.target.value);
                    }}
                    placeholder="Search by lookup code or lookup name..."
                    className="
      h-11
w-[1200px]
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

                {/* <div className="space-y-2">
                  <label
                    htmlFor="lookupCode"
                    className="block text-[13px] font-medium text-[#667085]"
                  >
                    Lookup Code
                  </label>

                  <input
                    id="lookupCode"
                    type="text"
                    value={lookupCode}
                    onChange={(event) => setLookupCode(event.target.value)}
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
                </div> */}
                {/* Lookup Name */}
                {/* <div className="space-y-2">
                  <label
                    htmlFor="lookupName"
                    className="block text-[13px] font-medium text-[#667085]"
                  >
                    Lookup Name
                  </label>

                  <input
                    id="lookupName"
                    type="text"
                    value={lookupName}
                    onChange={(event) => setLookupName(event.target.value)}
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
                </div> */}
              </div>

              {/* Table */}
              <div className="mt-7 overflow-hidden rounded-xl border border-[#E2E6EE]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                      <tr className="bg-[#F7F9FC]">
                        <th
                          className="
                            w-[80px]
                            border-b
                            border-[#E2E6EE]
                            px-4
                            py-3
                            text-center
                            text-[12px]
                            font-semibold
                            text-[#667085]
                          "
                        >
                          Sr
                        </th>

                        <th
                          className="
                            w-[220px]
                            border-b
                            border-[#E2E6EE]
                            px-4
                            py-3
                            text-left
                            text-[12px]
                            font-semibold
                            text-[#667085]
                          "
                        >
                          Lookup Code
                        </th>

                        <th
                          className="
                            border-b
                            border-[#E2E6EE]
                            px-4
                            py-3
                            text-left
                            text-[12px]
                            font-semibold
                            text-[#667085]
                          "
                        >
                          Lookup Description
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {lookupData.map((item, index) => (
                        <tr
                          key={item.id}
                          className="
                            h-[58px]
                            transition-colors
                            hover:bg-[#F7F9FC]
                          "
                        >
                          <td
                            className="
                              border-b
                              border-[#E2E6EE]
                              px-4
                              text-center
                              text-sm
                              text-[#667085]
                            "
                          >
                            {index + 1}
                          </td>

                          <td
                            className="
                              border-b
                              border-[#E2E6EE]
                              px-4
                              text-sm
                              font-medium
                              text-[#172033]
                            "
                          >
                            {item.lookupCode}
                          </td>

                          <td
                            className="
                              border-b
                              border-[#E2E6EE]
                              px-4
                              text-sm
                              text-[#667085]
                            "
                          >
                            {item.lookupDescription}
                          </td>
                        </tr>
                      ))}

                      {/* Preserve existing empty-row behavior */}
                      {lookupData.length < 6 &&
                        Array.from({
                          length: 6 - lookupData.length,
                        }).map((_, index) => (
                          <tr key={`empty-${index}`} className="h-[58px]">
                            <td className="border-b border-[#E2E6EE] px-4" />
                            <td className="border-b border-[#E2E6EE] px-4" />
                            <td className="border-b border-[#E2E6EE] px-4" />
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              {/* <div className="mt-6 flex flex-wrap justify-end gap-3">
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
                    duration-150
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
                    duration-150
                    hover:bg-[#1B3269]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#213B7A]/20
                  "
                >
                  Submit
                </button>
              </div> */}
            </form>
          </div>
        </section>
      </div>

      {/* Existing Popup */}
      <LookupTypePopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSubmit={handlePopupSubmit}
      />
    </AppShell>
  );
}
