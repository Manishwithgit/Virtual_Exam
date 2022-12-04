const router = require("express").Router();
const pool = require("../config/database");
var formidable = require("formidable");
var fs = require("fs");
const mv = require("mv");
const moment = require("moment");

router.get("/", async function (req, res) {
	try {
		console.log(req.session, req.user);
		req.session.exam_id = 0;
		let sql;
		if (req.user.type == 0) {
			sql =
				"SELECT a.exam_id AS exam_id, a.exam_name AS exam_name, a.sub_name AS subject, a.total_marks AS total_marks, a.duration AS duration, a.client_id AS client_id,a.date AS date,a.handle AS handle,a.confirm AS confirm FROM exam AS a";
		}
		if (req.user.type == 1) {
			sql =
				"SELECT a.exam_id AS exam_id, a.exam_name AS exam_name, a.sub_name AS subject, a.total_marks AS total_marks, a.duration AS duration, a.client_id AS client_id,a.date AS date,a.handle AS handle,a.confirm AS confirm FROM exam AS a WHERE  a.client_id ='" +req.user.client_id +"'";
		}
		if (req.user.type == 2) {
			sql =
				"SELECT a.exam_id AS exam_id,a.sub_id AS subject,a.setter_id AS user_id,b.exam_name AS exam_name, b.total_marks AS total_marks, b.duration AS duration, b.client_id AS client_id,b.date AS date,b.handle AS handle,b.confirm FROM setter_map AS a INNER JOIN exam AS b ON a.exam_id=b.exam_id  WHERE a.setter_id=" +
				req.user.setter_id +
				" AND b.client_id ='" +
				req.user.client_id +
				"'";
		}
		const result = await pool.query(sql);
		result.forEach(res => {
        		res.date = moment(res.date).format('YYYY-MM-DD');
       		})

		const result2 = await pool.query("SELECT client_id,client_name FROM client_details");

		res.render("manage_qa.ejs", {
			user: result,
			id: 4,
			type: req.user.type,
			name: result2,
		});
	} catch (err) {
		throw err;
	}
});

router.post("/edit", function (req, res) {
	//Set new Session variable values//
	console.log(req.body);
	req.session.exam_id = req.body.exam_id;
	req.session.subject = req.body.subject;
	req.session.total_marks = req.body.total_marks;
	req.session.confirm = req.body.confirm;
	res.redirect(307, "/manage_qa/edit/ques");
});

//Remove HTML TAG//
function strip_html_tags(str) {
	if (str === null || str === "") return false;
	else str = str.toString();
	return str
		
		.replace(/&nbsp;/g, "")
		.replace(/&lsquo;/g, "")
		.replace(/&rsquo;/g, "")
		.replace(/&ldquo;/g, "'")
		.replace(/&rdquo;/g, "'")
		.replace(/&&#818;/g, "_")
		
}
router.post("/edit/ques", async function (req, res) {
	try {
		let sql, sql4;
		if (req.user.type == 0) {
			sql =
				"SELECT ques_id,ques,option_1,option_2,option_3,option_4,ques_img,option_1_img,option_2_img,option_3_img,option_4_img,ans,pos_marks,neg_marks,sub_name,type FROM quest_" +
				req.session.exam_id +
				" WHERE del=" +
				0 +
				"";
		}
		if (req.user.type == 1) {
			sql =
				"SELECT ques_id,ques,option_1,option_2,option_3,option_4,ques_img,option_1_img,option_2_img,option_3_img,option_4_img,ans,pos_marks,neg_marks,sub_name,type FROM quest_" +
				req.session.exam_id +
				" WHERE client_id=" +
				req.user.client_id +
				" AND del=" +
				0 +
				"";
		}
		if (req.user.type == 2) {
			sql =
				"SELECT ques_id,ques,option_1,option_2,option_3,option_4,ans,ques_img,option_1_img,option_2_img,option_3_img,option_4_img,pos_marks,neg_marks,sub_name,type FROM quest_" +
				req.session.exam_id +
				" WHERE client_id=" +
				req.user.client_id +
				" AND set_by=" +
				req.user.user_id +
				" AND del=" +
				0 +
				"";
		}
		const result = await pool.query(sql);

		const result2 = await pool.query("SELECT a.sub_id AS sub_id,a.sub_name AS sub_name FROM subject AS a");

		if (req.user.type == 0) {
			sql4 = "SELECT SUM(pos_marks) cal_marks FROM quest_" + req.session.exam_id + " WHERE set_by=" + req.user.user_id + " AND del=" + 0 + "";
		} else {
			sql4 = "SELECT SUM(pos_marks) cal_marks FROM quest_" + req.session.exam_id + " WHERE client_id='" + req.user.client_id + "' AND del=" + 0 + "";
		}
		const result4 = await pool.query(sql4);
		const result5 = await pool.query("SELECT MAX(ques_id) AS count FROM quest_" + req.session.exam_id + "");

		for (let i = 0; i < result.length; i++) {
			result[i].ques = strip_html_tags(result[i].ques);
			result[i].ans = strip_html_tags(result[i].ans);
			result[i].option_1 = strip_html_tags(result[i].option_1);
			result[i].option_2 = strip_html_tags(result[i].option_2);
			result[i].option_3 = strip_html_tags(result[i].option_3);
			result[i].option_4 = strip_html_tags(result[i].option_4);
		}
		res.render("manage_qa_edit.ejs", {
			ques: result,
			marks: result4,
			subject_exam: req.session.subject,
			total_marks: req.session.total_marks,
			id: 4,
			subject_all: result2,
			type: req.user.type,
			confirm: req.session.confirm,
			exam_id: req.session.exam_id,
			count: result5[0].count,
		});
	} catch (err) {
		throw err;
	}
});

//AJAX Call
router.post("/edit/details", async function (req, res) {
	try {
		console.log(req.body);
		const result = await pool.query("SELECT * FROM quest_" + req.session.exam_id + " AS a WHERE a.ques_id='" + req.body.ques_id + "'");
		console.log(result);
		for (let i = 0; i < result.length; i++) {
			result[i].ques = strip_html_tags(result[i].ques);
			result[i].ans = strip_html_tags(result[i].ans);
			result[i].option_1 = strip_html_tags(result[i].option_1);
			result[i].option_2 = strip_html_tags(result[i].option_2);
			result[i].option_3 = strip_html_tags(result[i].option_3);
			result[i].option_4 = strip_html_tags(result[i].option_4);
		}
		res.send({
			user: result,
		});
	} catch (err) {
		throw err;
	}
});
//End Of Ajax Call

//Subjective Modal//
router.post("/edit/sub", function (req, res) {
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.maxFieldsSize = 10 * 1024 * 1024;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			console.error("Error", err);
			throw err;
		}

		var x = +fields.ques_no + 1;
		var a;
		//Path For Question Subjective//
		if (files.ques_img.size) {
			var oldpath = files.ques_img.path;
			fileExt = files.ques_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
				console.log("Success");
			});
			a = "ques_" + x + "." + fileExt + "";
		}
		//Sql Query//
		console.log(fields);
		var obj = {};
		//Assign Values To The Object//
		question = fields.question_s;
		question = question
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		obj["ques"] = question;
		obj["ques_img"] = a;
		obj["ans"] = fields.answer_s;
		obj["pos_marks"] = fields.pos_marks;
		obj["neg_marks"] = 0;
		obj["sub_name"] = fields.sub_name;
		obj["set_by"] = req.user.user_id;
		obj["client_id"] = req.user.client_id;
		obj["type"] = 2;

		const result = await pool.query("INSERT INTO quest_" + req.session.exam_id + " SET ?", [obj]);
		res.redirect(307, "/manage_qa/edit/ques");
	});
});

//Objective Modal//
router.post("/edit/obj", function (req, res) {
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.maxFieldsSize = 10 * 1024 * 1024;

	var fields = {},
		files = {};
	var ar = [];

	form.on("field", function (name, value) {
		fields[name] = value;

		if (name.slice(-2) === "[]") {
			var realName = name.slice(0, name.length - 2);
			if (realName in fields) {
				if (!Array.isArray(fields[realName])) {
					fields[realName] = [fields[realName]];
				}
			} else {
				fields[realName] = [];
			}
			fields[realName].push(value);
			ar = fields[realName];
		} else {
			fields[name] = value;
		}
	});

	form.parse(req, async (err, fields, files) => {
		if (err) {
			console.error("Error", err);
			throw err;
		}

		var x = +fields.ques_no + 1;
		var a, b, c, d, e;

		//Path for objective question//
		if (files.ques_img_o_0.size) {
			var oldpath = files.ques_img_o_0.path;
			fileExt = files.ques_img_o_0.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
				// console.log("Success");
			});
			a = "ques_" + x + "." + fileExt + "";
		}

		//Path for objective option1
		if (files.op_1_img.size) {
			var oldpath = files.op_1_img.path;
			fileExt = files.op_1_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "_op1." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			b = "ques_" + x + "_op1." + fileExt + "";
		}

		//Path for objective option2
		if (files.op_2_img.size) {
			var oldpath = files.op_2_img.path;
			fileExt = files.op_2_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "_op2." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			c = "ques_" + x + "_op2." + fileExt + "";
		}

		//Path For objective option3
		if (files.op_3_img.size) {
			var oldpath = files.op_3_img.path;
			fileExt = files.op_3_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "_op3." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			d = "ques_" + x + "_op3." + fileExt + "";
		}

		//Path for objective option4
		if (files.op_4_img.size) {
			var oldpath = files.op_4_img.path;
			fileExt = files.op_4_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_" + x + "_op4." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			e = "ques_" + x + "_op4." + fileExt + "";
		}
		console.log(fields);
		var obj = {};
		// console.log("length",ar,ar.length);
		//Assign Values To The Object//
		question = fields.question_o;
		question = question
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option1 = fields.option1_o;
		option1 = option1
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option2 = fields.option2_o;
		option2 = option2
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option3 = fields.option3_o;
		option3 = option3
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option4 = fields.option4_o;
		option4 = option4
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		obj["ques"] = question;
		obj["ques_img"] = a;
		obj["option_1"] = option1;
		obj["option_1_img"] = b;
		obj["option_2"] = option2;
		obj["option_2_img"] = c;
		obj["option_3"] = option3;
		obj["option_3_img"] = d;
		obj["option_4"] = option4;
		obj["option_4_img"] = e;
		obj["ans"] = ar.toString();
		obj["pos_marks"] = fields.pos_marks;
		obj["neg_marks"] = fields.neg_marks;
		obj["sub_name"] = fields.sub_name;
		obj["set_by"] = req.user.user_id;
		obj["client_id"] = req.user.client_id;
		if (ar.length == 1) {
			obj["type"] = 3;
		} else {
			obj["type"] = 1;
		}
		//Sql Query//
		const result = await pool.query("INSERT INTO quest_" + req.session.exam_id + " SET ?", [obj]);
		console.log(result);
		res.redirect(307, "/manage_qa/edit/ques");
	});
});

//Remove Question//
router.post("/edit/remove", async function (req, res) {
	try {
		console.log(req.body);
		const result = await pool.query(
			"UPDATE quest_" + req.session.exam_id + " SET del=" + 1 + " WHERE client_id=" + req.user.client_id + " AND ques_id=" + req.body.ques_id + ""
		);
		console.log(result);
		res.redirect(307, "/manage_qa/edit/ques");
	} catch (err) {
		throw err;
	}
});

//Add Custom Instructions//
router.post("/edit/inst", async function (req, res) {
	try {
		console.log(req.body);
		const result = await pool.query("UPDATE exam SET inst='" + req.body.inst + "' WHERE exam_id=" + req.session.exam_id + "");
		console.log(result);
		res.redirect(307, "/manage_qa/edit/ques");
	} catch (err) {
		throw err;
	}
});

//Edit Subjective Model//
router.post("/edit/updsub", function (req, res) {
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.maxFieldsSize = 10 * 1024 * 1024;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			console.error("Error", err);
			throw err;
		}
		console.log("here", fields);

		var a;
		var obj = {};
		//Path For Question Subjective//
		if (files.ques_img.size) {
			var oldpath = files.ques_img.path;
			fileExt = files.ques_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "." + fileExt + "";
			console.log(oldpath);
			console.log(newpath);
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			a = "ques_u_" + fields.ques_id + "." + fileExt + "";
		}

		//Assign Values To The Object//
		if (a) {
			obj["ques_img"] = a;
		}
		question = fields.question;
		question = question
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		obj["ques"] = question;
		obj["ans"] = fields.answer;
		obj["pos_marks"] = fields.pos_marks;
		obj["sub_name"] = fields.sub_name;

		//Sql Query//
		const result = await pool.query("UPDATE quest_" + req.session.exam_id + " SET ? WHERE client_id=" + req.user.client_id + " AND ques_id=" + fields.ques_id + "", [obj]);
		console.log(result);
		res.redirect(307, "/manage_qa/edit/ques");
	});
});

//Edit Objective Modal//
router.post("/edit/updobj", function (req, res) {
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.maxFieldsSize = 10 * 1024 * 1024;

	var fields = {},
		files = {};
	var ar = [];

	form.on("field", function (name, value) {
		fields[name] = value;

		// console.log(name, value);
		if (name.slice(-2) === "[]") {
			var realName = name.slice(0, name.length - 2);
			if (realName in fields) {
				if (!Array.isArray(fields[realName])) {
					fields[realName] = [fields[realName]];
				}
			} else {
				fields[realName] = [];
			}

			fields[realName].push(value);
			ar = fields[realName];
		} else {
			fields[name] = value;
		}
	});

	form.parse(req, async (err, fields, files) => {
		if (err) {
			console.error("Error", err);
			throw err;
		}
		console.log(fields);
		var a, b, c, d, e;
		var obj = {};
		//Path for objective question//
		if (files.ques_img_o.size) {
			var oldpath = files.ques_img_o.path;
			fileExt = files.ques_img_o.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			a = "ques_u_" + fields.ques_id + "." + fileExt + "";
		}

		//Path for objective option1
		if (files.op_1_img.size) {
			var oldpath = files.op_1_img.path;
			fileExt = files.op_1_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "_op1." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			b = "ques_u_" + fields.ques_id + "_op1." + fileExt + "";
		}

		//Path for objective option2
		if (files.op_2_img.size) {
			var oldpath = files.op_2_img.path;
			fileExt = files.op_2_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "_op2." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			c = "ques_u_" + fields.ques_id + "_op2." + fileExt + "";
		}

		//Path For objective option3
		if (files.op_3_img.size) {
			var oldpath = files.op_3_img.path;
			fileExt = files.op_3_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "_op3." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			d = "ques_u_" + fields.ques_id + "_op3." + fileExt + "";
		}

		//Path for objective option4
		if (files.op_4_img.size) {
			var oldpath = files.op_4_img.path;
			fileExt = files.op_4_img.name.split(".").pop();
			var newpath = "./public/uploads/" + "Exam_" + req.session.exam_id + "/" + "ques_u_" + fields.ques_id + "_op4." + fileExt + "";
			mv(oldpath, newpath, err => {
				if (err) throw err;
			});
			e = "ques_u_" + fields.ques_id + "_op4." + fileExt + "";
		}

		//Assign Values To The Object//
		if (a) {
			obj["ques_img"] = a;
		}
		if (b) {
			obj["option_1_img"] = b;
		}
		if (c) {
			obj["option_2_img"] = c;
		}
		if (d) {
			obj["option_3_img"] = d;
		}
		if (e) {
			obj["option_4_img"] = e;
		}
		question = fields.question;
		question = question
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option1 = fields.option1;
		option1 = option1
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option2 = fields.option2;
		option2 = option2
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option3 = fields.option3;
		option3 = option3
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		option4 = fields.option4;
		option4 = option4
			.replace(/(?:\r\n|\r|\n)/g, "<br>")
			.replace(/\\/g, "/")
			.replace(/\"/g, "'")
			.replace(/\t/g, ' ');

		obj["ques"] = question;
		obj["ans"] = ar.toString();
		obj["option_1"] = option1;
		obj["option_2"] = option2;
		obj["option_3"] = option3;
		obj["option_4"] = option4;
		obj["pos_marks"] = fields.pos_marks;
		obj["neg_marks"] = fields.neg_marks;
		obj["sub_name"] = fields.sub_name;
		if (ar.length == 1) {
			obj["type"] = 3;
		} else {
			obj["type"] = 1;
		}

		//SQL Query //
		const result = await pool.query("UPDATE quest_" + req.session.exam_id + " SET ? WHERE client_id=" + req.user.client_id + " AND ques_id=" + fields.ques_id + "", [obj]);
		console.log(result);
		res.redirect(307, "/manage_qa/edit/ques");
	});
});

module.exports = router;
