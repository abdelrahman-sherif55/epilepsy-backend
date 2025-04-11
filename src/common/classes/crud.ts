import * as mongoose from 'mongoose';
import { Features } from './features';

export class Crud<ModelType> {
  constructor(
    private readonly model: mongoose.Model<ModelType>,
    private readonly modelName: string,
  ) {}

  public async getAll(query: any, filter?: any) {
    const filterData: any = filter || {};
    let searchLength: number = 0;
    let flagSearch: boolean = false;
    if (query) {
      flagSearch = true;
      const searchResult: Features = new Features(
        this.model.find(filterData),
        query,
      )
        .filter()
        .search(this.modelName);
      const searchData: ModelType[] = await searchResult.mongooseQuery;
      searchLength = searchData.length;
    }
    const documentsCount: number = flagSearch
      ? searchLength
      : await this.model.find(filterData).countDocuments();
    const apiFeatures: Features = new Features(
      this.model.find(filterData),
      query,
    )
      .filter()
      .sort()
      .limitFields()
      .search(this.modelName)
      .pagination(documentsCount);
    const documents: ModelType[] = await apiFeatures.mongooseQuery;
    return {
      length: documents.length,
      pagination: apiFeatures.paginationResult,
      data: JSON.parse(JSON.stringify(documents, null, 2)),
    };
  }

  public async getAllList(query: any, filter?: any) {
    const filterData: any = filter || {};
    const apiFeatures: Features = new Features(
      this.model.find(filterData),
      query,
    )
      .filter()
      .sort()
      .limitFields();
    const documents: ModelType[] = await apiFeatures.mongooseQuery;
    return {
      length: documents.length,
      data: JSON.parse(JSON.stringify(documents, null, 2)),
    };
  }

  public async createOne(data: any): Promise<ModelType> {
    const document: ModelType = await this.model.create(data);
    return JSON.parse(JSON.stringify(document, null, 2));
  }

  public async getOne(id: any, population?: string): Promise<ModelType> {
    let query = this.model.findById(id);
    if (population) query = query.populate(population);
    const document: ModelType = await query;
    return JSON.parse(JSON.stringify(document, null, 2));
  }

  public async updateOne(id: any, data: any): Promise<ModelType> {
    const document: ModelType = await this.model.findByIdAndUpdate(id, data, {
      new: true,
    });
    return JSON.parse(JSON.stringify(document, null, 2));
  }

  public async deleteOne(id: any): Promise<ModelType> {
    const document: ModelType = await this.model.findByIdAndDelete(id);
    return JSON.parse(JSON.stringify(document, null, 2));
  }
}
