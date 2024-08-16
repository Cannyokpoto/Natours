
class APIFeatures {
    constructor (query, queryString){
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      //destructuring the query object
      const queryObj = { ...this.queryString };
      //pushing in an array of query parameters into the query object. 
      //Some of these params will be ignored if they'er not included in the request
      const excludedFields = ["page", "sort", "limit", "fields"];
      excludedFields.forEach(el => delete queryObj[el]);
  
      //Advanced filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      console.log(JSON.parse(queryStr));
  
      this.query = this.query.find(JSON.parse(queryStr))
      return this;
    }
  
    //sorting
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(",").join(" ");
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort("-price");
      }
      return this;
    }
  
    //Limiting field
      // To permanently hide certain fields from the client, simple add select: false to 
      // the schema option of that particular field
  
      limitFields() {
        if (this.queryString.fields) {
          const fields = this.queryString.fields.split(",").join(" ");
          this.query = this.query.select(fields);
        } else {
          this.query = this.query.select('-__v');
        }
  
        return this;
      }
  
      //Pagination
      paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
      }
  }

  module.exports = APIFeatures;