'use strict';

// ── sendSuccess helper ────────────────────────────────────
const sendSuccess = (res, statusCode = 200, payload = {}, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    ...payload,
  });
};

// ── ApiFeatures — chainable query builder ─────────────────
class ApiFeatures {
  constructor(query, queryStr) {
    this.query    = query;
    this.queryStr = queryStr;
    this.meta     = {};
  }

  filter() {
    const exclude = ['page', 'limit', 'sort', 'fields', 'search', 'q'];
    const q       = { ...this.queryStr };
    exclude.forEach(k => delete q[k]);

    // Convert gte/lte/gt/lt to MongoDB operators
    let str = JSON.stringify(q);
    str     = str.replace(/\b(gte|lte|gt|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(str));
    return this;
  }

  search() {
    if (this.queryStr.search || this.queryStr.q) {
      const term = this.queryStr.search || this.queryStr.q;
      this.query = this.query.find({ $text: { $search: term } });
    }
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query   = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query   = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page  = Math.max(parseInt(this.queryStr.page,  10) || 1, 1);
    const limit = Math.min(parseInt(this.queryStr.limit, 10) || 20, 100);
    const skip  = (page - 1) * limit;

    this.query    = this.query.skip(skip).limit(limit);
    this.meta     = { page, limit };
    return this;
  }
}

module.exports = { sendSuccess, ApiFeatures };