'use strict';

// ─── Standard response helpers ────────────────────────────
exports.sendSuccess = (res, statusCode, data = {}, message = 'Success') => {
  res.status(statusCode).json({ success: true, message, ...data });
};

// ─── Advanced query: filter / sort / paginate / project ───
class ApiFeatures {
  constructor(query, queryStr) {
    this.query    = query;
    this.queryStr = queryStr;
  }

  filter() {
    const qObj = { ...this.queryStr };
    ['page', 'limit', 'sort', 'fields', 'q'].forEach(k => delete qObj[k]);

    // Advanced filtering: gte, gt, lte, lt
    let str = JSON.stringify(qObj).replace(/\b(gte|gt|lte|lt)\b/g, m => `$${m}`);
    this.query = this.query.find(JSON.parse(str));
    return this;
  }

  search() {
    if (this.queryStr.q) {
      this.query = this.query.find({ $text: { $search: this.queryStr.q } });
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
    const page  = Math.max(parseInt(this.queryStr.page, 10) || 1, 1);
    const limit = Math.min(parseInt(this.queryStr.limit, 10) || 20, 100);
    this.query  = this.query.skip((page - 1) * limit).limit(limit);
    this.meta   = { page, limit };
    return this;
  }
}

exports.ApiFeatures = ApiFeatures;