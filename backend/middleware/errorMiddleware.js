export const errorHandler = (err, req, res, next) => {

  console.error("❌ Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      msg: "Validation error",
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      msg: "Invalid ID",
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      msg: "Duplicate entry",
    });
  }

  res.status(500).json({
    msg: "Internal server error",
  });
};