const router = require("express").Router();
const pool = require("../config/database");
var fs = require("fs");
var moment = require("moment");

router.get("/", function (req, res) {
	pool.getConnection((err, conn) => {
		if (err) throw err;

		var sql = "SELECT sub_id AS id, sub_name AS name FROM subject ";

		var sql2 = "SELECT client_id,client_name FROM client_details";

		if (req.user.type == 0)
			var sql1 =
				"SELECT a.exam_id,a.exam_name,a.sub_name,a.start_time,a.date,a.confirm,a.client_id,a.total_marks,a.duration,a.login_window FROM exam AS a WHERE a.date >= CURRENT_DATE() AND a.handle=" +
				0 +
				"";
		else {
			var sql1 =
				"SELECT a.exam_id,a.exam_name,a.sub_name,a.confirm,a.start_time,a.date,a.total_marks,a.duration,a.login_window FROM exam AS a WHERE a.client_id='" +
				req.user.client_id +
				"'";
		}

		conn.query(sql, function (err, result) {
			if (err) throw err;

			conn.query(sql2, function (err, result2) {
				if (err) throw err;
				console.log(result2);
				conn.query(sql1, function (err, result1) {
					if (err) throw err;
					console.log(result1);

					result1.forEach(res => {
						res.date = moment(res.date).format("YYYY-MM-DD");
					});
					console.log(req.flash("dupl_exam"));
					res.render("manage_exam.ejs", {
						subjects: result,
						exam: result1,
						id: 2,
						type: req.user.type,
						name: result2,
						dupl_exam: req.flash("dupl_exam"),
					});

					conn.release();
				});
			});
		});
	});
});

//AJAX Call
router.post("/details", function (req, res) {
	pool.getConnection((err, conn) => {
		if (err) throw err;
		//console.log(req.body);
		var sql =
			"SELECT a.exam_id, a.exam_name, a.sub_name, a.date, a.warning, a.total_marks,a.start_time,a.duration,a.login_window FROM exam AS a WHERE a.exam_id='" +
			req.body.exam_id +
			"'";
		//console.log(sql);
		conn.query(sql, function (err, result) {
			if (err) throw err;
			result.forEach(res => {
				res.date = moment(res.date).format("YYYY-MM-DD");
			});
			console.log(result);
			if (err) throw err;
			res.send({
				user: result,
			});
		});
		conn.release();
	});
});
//End Of Ajax Call

router.post("/reinitialize", async (req, res) => {
	try {
		const { exam_id } = req.body;

		const result = await pool.query(
			"UPDATE exam SET checked = 0, handle = 0 WHERE exam_id = ?",
			[exam_id]
		);

		res.redirect("/manage_exam");
	} catch (err) {
		throw err;
	}
});

//Edit Exam Details//
router.post("/edit", function (req, res) {
	pool.getConnection((err, conn) => {
		if (err) throw err;
		//console.log(req.body);
		var sql =
			"UPDATE exam SET `exam_name`='" +
			req.body.exam_name +
			"',`date`='" +
			req.body.date +
			"',`duration`='" +
			req.body.duration +
			"',`total_marks`='" +
			req.body.tot_marks +
			"',`warning`='" +
			req.body.warn +
			"',`start_time`='" +
			req.body.time +
			"',`login_window`='" +
			req.body.login_window +
			"' WHERE exam_id='" +
			req.body.exam_id +
			"'";
		console.log(sql);
		conn.query(sql, function (err, result) {
			if (err) throw err;
			console.log(result);
			res.redirect("/manage_exam");
		});
		conn.release();
	});
});
//End Of Edit Exam Details//

router.post("/add_exam", function (req, res) {
	console.log(req.body);

	var subs = req.body.subject.split(",");
	var temp = 0;
	var ids = subs.filter(sub => Number.isInteger(parseInt(sub)));
	var subject = subs.filter(sub => !ids.includes(sub));

	var sql1 = "SELECT exam_name FROM exam WHERE handle=1";
	pool.query(sql1, function (err, result1) {
		if (err) throw err;
		/*for(var i=0;i<result1.length;i++)
    {
      if(result1[i].exam_name==req.body.exam_name)
      {
        temp=1;
        console.log("hde")
        console.log(req.flash('dupl_exam'))
      }
    }*/

		if (subject.length > 0) {
			let sub_temp = subject.map(sub => "('" + sub + "')");
			var query = "INSERT INTO `subject` (`sub_name`) VALUES " + sub_temp.join(", ");

			pool.getConnection((err, conn) => {
				if (err) throw err;

				conn.query(query, (error, result) => {
					if (error) throw error;

					var id = result.insertId;
					for (var i = 0; i < subject.length; i++) {
						ids.push(id + i);
					}

					conn.release();
					if (temp == 0) insertExam();
				});
			});
		} else {
			if (temp == 0) insertExam();
		}
	});

	function insertExam() {
		var exam_id;

		pool.getConnection(async (err, conn) => {
			if (err) console.log(err);

			warn = parseInt(req.body.warn) + +2;

			var sql =
				"INSERT INTO `exam`(`exam_name`,`sub_name`,`date`,`warning`,`total_marks`,`start_time`,`duration`, `client_id`, `handle`,`login_window`) VALUES ('" +
				req.body.exam_name +
				"','" +
				ids.toString() +
				"','" +
				req.body.date +
				"'," +
				warn +
				"," +
				req.body.tot_marks +
				",'" +
				req.body.time +
				"'," +
				req.body.duration +
				"," +
				req.user.client_id +
				"," +
				0 +
				",'" +
				req.body.login_window +
				"')";

			await conn.query(sql, async function (err, result) {
				if (err) throw err;

				exam_id = result.insertId;
				console.log(exam_id);

				var sql4 =
					"CREATE TABLE IF NOT EXISTS quest_" +
					exam_id +
					" (ques_id int primary key auto_increment,ques text DEFAULT NULL,ques_img text DEFAULT NULL,option_1 text DEFAULT NULL,option_1_img text DEFAULT NULL,option_2 text DEFAULT NULL,option_2_img text DEFAULT NULL,option_3 text DEFAULT NULL,option_3_img text DEFAULT NULL,option_4 text DEFAULT NULL,option_4_img text DEFAULT NULL,ans text DEFAULT NULL,pos_marks int(100) DEFAULT " +
					0 +
					",neg_marks int(100) DEFAULT " +
					0 +
					",sub_name text,set_by int(100) DEFAULT " +
					0 +
					",client_id int(100) DEFAULT " +
					1 +
					",type int(10), del int(100) DEFAULT " +
					0 +
					")";
				// console.log(sql);
				conn.query(sql4, function (err, result4) {
					if (err) throw err;
					console.log("Question Table", result4);
				});

				var sql5 =
					"CREATE TABLE IF NOT EXISTS res_" +
					exam_id +
					" (id int primary key auto_increment,reg_no varchar(100) DEFAULT " +
					0 +
					",handle int(10) DEFAULT " +
					0 +
					",checked int(10) DEFAULT " +
					0 +
					",ch_admin int(10) DEFAULT " +
					0 +
					",ch_client int(10) DEFAULT " +
					0 +
					")";
				conn.query(sql5, function (err, result5) {
					if (err) throw err;
					console.log("Response Table", result5);
				});
				//Create An Exam Folder//
				var dir = "./public/uploads/" + "Exam_" + exam_id;
				console.log(dir);
				if (!fs.existsSync(dir)) {
					await fs.mkdirSync(dir);
				}
				var dir1 = "./public/uploads/" + "Exam_" + exam_id + "/res_" + exam_id;
				console.log(dir);
				if (!fs.existsSync(dir1)) {
					await fs.mkdirSync(dir1);
				}
			});

			conn.release();
		});
	}
	if (temp == 1) {
		req.flash("dupl_exam", "Exam of this name has already been used before");
	}
	res.redirect("/manage_exam");
});

router.post("/confirm", function (req, res) {
	pool.getConnection((err, conn) => {
		if (err) console.log(err);
		console.log(req.body);
		var sql = "SELECT * FROM quest_" + req.body.exam_id + " WHERE del=" + 0 + "";
		conn.query(sql, function (err, result) {
			if (err) throw err;
			console.log(result);

			for (var i = 0; i < result.length; i++) {
				var sql2 =
					"ALTER TABLE `res_" +
					req.body.exam_id +
					"` ADD `" +
					result[i].ques_id +
					"` text NULL";
				console.log(sql2);
				conn.query(sql2, function (err, result2) {
					if (err) throw err;
					console.log(result2);
				});

				//ADD corr_id Columns//
				var sql3 =
					"ALTER TABLE `res_" +
					req.body.exam_id +
					"` ADD `corr_" +
					result[i].ques_id +
					"` int(10) NULL";
				conn.query(sql3, function (err, result3) {
					if (err) throw err;
					console.log(result3);
				});
			}

			//ADD marks Columns In The End//

			var sql4 =
				"ALTER TABLE `res_" +
				req.body.exam_id +
				"` ADD `marks` int(100) DEFAULT '" +
				0 +
				"'";
			console.log(sql4);
			conn.query(sql4, function (err, result4) {
				if (err) throw err;
				console.log(result4);
			});

			var sql5 = "UPDATE exam SET confirm=" + 1 + " WHERE exam_id=" + req.body.exam_id + "";
			conn.query(sql5, function (err, result5) {
				if (err) throw err;
				console.log(result5);
			});

			var sql5 =
				"UPDATE setter_map SET completed=" + 1 + " WHERE exam_id=" + req.body.exam_id + "";
			conn.query(sql5, function (err, result5) {
				if (err) throw err;
				console.log(result5);
			});
		});
		conn.release();
	});
	res.redirect("/manage_exam");
});

router.post("/remove", function (req, res) {
	console.log(req.body);
	pool.getConnection((err, conn) => {
		if (err) throw err;
		var sql = "UPDATE exam SET handle=" + 1 + " WHERE exam_id=" + req.body.exam_id + "";
		conn.query(sql, function (err, result) {
			if (err) throw err;
			console.log(result);
			res.redirect("/manage_exam");
		});
		conn.release();
	});
});

module.exports = router;
