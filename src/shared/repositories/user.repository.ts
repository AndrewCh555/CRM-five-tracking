import { InjectModel } from '@nestjs/sequelize';
import sequelize, { Op } from 'sequelize';

import { UserSignUpInterface } from '@common/interfaces/user';
import { UpdateUserRequestDto } from '@modules/user/dto';
import { Department, File, Profile, Project, Role, User } from '@shared/models';
import { StatisticCount } from '@common/types/statistic';
import { mappingUpdateResponse } from '@shared/helpers';
import { ZERO } from '@common/constants';

export class UserRepository {
  constructor(
    @InjectModel(User)
    private readonly user: typeof User,
  ) {}

  async findOneEmail(email: string): Promise<User> {
    return await this.user.findOne({
      where: {
        email,
      },
      include: ['profile', 'role'],
      nest: true,
      raw: true,
    });
  }

  async findOneWithToken(email: string, refreshToken: string): Promise<User> {
    return await this.user.findOne({
      where: {
        email,
        refreshToken,
      },
      include: ['profile'],
    });
  }

  async getAllCount(): Promise<number> {
    return this.user.count();
  }

  async getCountByProjectId(projectId: string): Promise<number> {
    let response = (await this.user.findOne({
      attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']],
      include: [
        {
          model: Project,
          attributes: [],
          where: {
            id: projectId,
          },
        },
      ],
      group: ['User.id'],
      raw: true,
    })) as StatisticCount;
    if (!response) {
      response = { count: ZERO };
    }
    return Number(response.count);
  }

  async findOneWithFileAndDepartment(id: string): Promise<User> {
    return await this.user.findOne({
      where: { id },
      include: [
        {
          model: Profile,
          include: [File],
        },
        {
          model: Department,
        },
      ],
    });
  }

  async changePassword(id: string, password: string): Promise<void> {
    await this.user.update(
      {
        password,
        changedPassword: true,
      },
      {
        where: {
          id,
        },
      },
    );
  }

  async findOneWithProfileAndDepartment(id: string): Promise<User> {
    return await this.user.findOne({
      where: { id },
      include: [
        {
          model: Profile,
          include: [File],
        },
        {
          model: Department,
        },
        {
          model: Role,
        },
      ],
    });
  }

  async searchByName(name: string): Promise<User[]> {
    return await this.user.findAll({
      include: {
        model: Profile,
        where: {
          [Op.or]: [
            {
              firstName: { [Op.iLike]: `%${name}%` },
            },
            {
              lastName: { [Op.iLike]: `%${name}%` },
            },
          ],
        },
        include: [File],
      },
    });
  }

  async findAllWithProfile(id: string[]): Promise<User[]> {
    return await this.user.findAll({
      where: { id },
      include: ['profile'],
    });
  }

  async findAllWithFileAndDepartment(): Promise<User[]> {
    return await this.user.findAll({
      include: [
        {
          model: Profile,
          include: [File],
        },
        {
          model: Department,
        },
      ],
    });
  }

  async findOneWithFile(id: string): Promise<User> {
    return await this.user.findOne({
      where: { id },
      include: [
        {
          model: Profile,
          include: [File],
        },
      ],
    });
  }

  async updateUser(id: string, roleId: string): Promise<void> {
    await this.user.update(
      {
        roleId,
      },
      {
        where: { id },
      },
    );
  }

  async create(data: UserSignUpInterface, roleId: string): Promise<User> {
    return await this.user.create({ ...data, roleId });
  }

  async update(id: string, data: UpdateUserRequestDto, departmentId: string): Promise<User> {
    const updatedData = await this.user.update(
      {
        departmentId,
        email: data.email,
      },
      {
        where: { id },
        returning: true,
      },
    );
    return mappingUpdateResponse<User>(updatedData);
  }

  async updateToken(id: string, refreshToken: string): Promise<void> {
    await this.user.update(
      {
        refreshToken,
      },
      {
        where: { id },
      },
    );
  }

  async delete(id: string): Promise<void> {
    await this.user.destroy({
      where: { id },
    });
  }
}
