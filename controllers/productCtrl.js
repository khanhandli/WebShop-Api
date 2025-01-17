const Products = require('../models/productModel');
const Categories = require('../models/categoryModel');
//filter, sorting and paginating

class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filtering() {
        const queryObj = { ...this.queryString }; //queryString= req.query
        // console.log({ before: queryObj }) // before delete page

        const excludedFields = ['page', 'sort', 'limit'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // console.log({ after: queryObj }) // after delete page

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, (match) => '$' + match);

        //gte = greater than or equal
        //lte = lesser than or equal
        //lt = lesser than
        //gt  = greater than
        this.query.find(JSON.parse(queryStr));

        return this;
    }

    sorting() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');

            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    paginating() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 8;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

const productCtrl = {
    getProducts: async (req, res) => {
        try {
            const features = new APIfeatures(Products.find(), req.query).filtering().sorting().paginating();
            const products = await features.query;
            // const product = await Products.query.find({ content: { $regex: "test" } })
            // console.log(product)
            res.json({
                status: 'success',
                result: products.length,
                products: products,
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    getOneProduct: async (req, res) => {
        try {
            const product = await Products.findById(req.params.id);
            res.json({
                status: 'success',
                product: product,
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    createProduct: async (req, res) => {
        try {
            const { product_id, title, price, description, images, category } = req.body;

            if (!images) return res.status(400).json({ msg: 'Ảnh không được tải lên' });

            const categoryItem = await Categories.findOne({ _id: category });

            const product = await Products.findOne({ product_id });
            if (product) return res.status(400).json({ msg: 'Sản phẩm đã tồn tại.' });

            const newProduct = new Products({
                product_id,
                title: title.toLowerCase(),
                price,
                description,
                images,
                category,
                category_name: categoryItem.name,
            });

            await newProduct.save();
            res.json({ msg: 'Thêm thành công' });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    deleteProduct: async (req, res) => {
        try {
            await Products.findByIdAndDelete(req.params.id);

            res.json({ msg: 'Xóa thành công' });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    updateProduct: async (req, res) => {
        try {
            const { title, price, description, images, category } = req.body;

            const categoryItem = await Categories.findOne({ _id: category });

            if (!images) return res.status(400).json({ msg: 'Không có ảnh tải lên' });

            await Products.findByIdAndUpdate(
                { _id: req.params.id },
                {
                    title: title.toLowerCase(),
                    price,
                    description,
                    images,
                    category,
                    category_name: categoryItem.name,
                }
            );

            res.json({ msg: 'Cập nhật thành công' });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    reviews: async (req, res) => {
        try {
            const { rating } = req.body;
            if (rating && rating !== 0) {
                const product = await Products.findById(req.params.id);
                if (!product) return res.status(400).json({ msg: 'Sản Phẩm Không Tồn Tại.' });

                let num = product.numReviews;
                let rate = product.rating;

                await Products.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        rating: rate + rating,
                        numReviews: num + 1,
                    }
                );

                res.json({ msg: 'Cập nhật thành công' });
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
};

module.exports = productCtrl;
