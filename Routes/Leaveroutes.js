const router = require("express").Router();
const Leave = require("../Models/Leavemodel.js");
const Staffdetails = require("../Models/Staffmodel.js");

router.get("/start2", (req, res) => {
  res.json({
    status: "API Works",
    message: "Welcome to Staff leave API",
  });
});

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      Name,
      Leavetype,
      StartDate,
      EndDate,
      Numberofdays,
      Reason,
      Command,
      Status,
    } = req.body;
    const staffMember = await Staffdetails.findOne({ username });

    if (!staffMember) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    if (
      Leavetype !== "Casualleave" &&
      Leavetype !== "Medicalleave" &&
      Leavetype !== "Menstrualleave"
    ) {
      return res.status(400).json({ message: "Invalid leave type." });
    }

    if (Leavetype === "Menstrualleave" && staffMember.Gender !== "female") {
      return res.json({
        status: "Error",
        message: "Menstrual leave is only applicable for women",
      });
    }

    // Get the most recent Menstrual leave request date
    const lastMenstrualLeaveDate = staffMember.lastMenstrualLeaveDate;

    if (Leavetype === "Menstrualleave" && lastMenstrualLeaveDate) {
      // Calculate the current month and year
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Calculate the month and year of the last Menstrual leave request
      const lastMonth = lastMenstrualLeaveDate.getMonth() + 1;
      const lastYear = lastMenstrualLeaveDate.getFullYear();

      if (currentMonth === lastMonth && currentYear === lastYear) {
        return res.status(400).json({
          message: "One Menstrualleave per month is allowed.",
        });
      }
    }

    if (staffMember[Leavetype] < Numberofdays) {
      return res.status(400).json({
        message: `Insufficient ${Leavetype} balance for leave request.`,
      });
    }

    const staff = Leave({
      username,
      Name,
      Leavetype,
      StartDate,
      EndDate,
      Numberofdays,
      Reason,
      Command,
      Status,
    });

    await staff.save();
    //staffMember[Leavetype] -= Numberofdays;
    //await staffMember.save();

    return res.json({
      message: "New staff leaverequest",
      data: staff,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Duplicate leave request detected." });
    }
    return res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
});

const Leavecontroller = require("../Controller/Leavecontroller.js");
router.route("/user/get_all").get(Leavecontroller.index);
//router.route("/user/status/:Status").get(Controller.see);
//router.route("/user/name/:Name").get(Controller.saw);
router.route("/user/id/:user_id").get(Leavecontroller.view);
router.route("/:user_id").put(Leavecontroller.update);
router.route("/:user_id").patch(Leavecontroller.update);
router.route("/:user_id").delete(Leavecontroller.Delete);

module.exports = router;
