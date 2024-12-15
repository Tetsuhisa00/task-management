require 'json'
require 'date'

class WbsController < ApplicationController
  def index
    @project = Project.find(params[:project_id])
    @tasks = Task.where(project_id: params[:project_id])
    @project_id = params[:project_id].to_i

    data = {}

    # model側に記述したほうがいいカモ
    @tasks.each do |task|
      task_data = {}
      shape_data = {}
      task_data['id'] = task.id.to_i
      task_data['title'] = task.title.to_s
      task_data['description'] = task.description.to_s
      status_id = task.status_id.to_i
      status = Status.find(status_id)
      task_data['status'] = status.name.nil? ? '未着手' : status.name.to_s
      priority_id = task.priority_id.to_i
      priority = Priority.find(priority_id)
      task_data['priority'] = priority.name.nil? ? '低' : priority.name.to_s
      task_data['start_date'] = task.start_date.to_s
      task_data['deadline'] = task.deadline.to_s
      tags = TagTable.where(task_id: task.id).where(project_id: @project_id)
      task_data['tags'] = tags.map{|tag| Tag.find(tag.tag_id).tag_category}
      task_data['work_output'] = task.work_output.to_s
      user = task.user_id.to_i != 0 ? User.find(task.user_id.to_i) : nil
      task_data['manager'] = user.nil? ? '' : user.user_name.to_s
      shape = Shape.find(task.shape_id)
      shape_data['x'] = shape.x.to_i
      shape_data['y'] = shape.y.to_i
      shape_data['width'] = shape.width.to_i
      shape_data['height'] = shape.height.to_i

      data['task_list'] ||= []
      data['task_list'].append({ 'task': task_data, 'shape': shape_data })
    end

    # connection_list の作成
    TaskRelation.where(project_id: params[:project_id]).each do |task_relation|
      connection_data = {}
      connection_data['start_task_id'] = task_relation.start_task_id.to_i
      connection_data['end_task_id'] = task_relation.end_task_id.to_i
      data['connection_list'] ||= []
      data['connection_list'].append(connection_data)
    end
    data['connection_list'] ||= []

    # tag_list の作成
    # data['tag_list'] = Tag.all.map{|tag| tag.tag_category}
    data['tag_list'] = ['タグ1', 'タグ2', 'タグ3', 'タグ4', 'タグ5'] # 仮のタグリスト

    @json = JSON.dump(data)
  end

  def post
    @project_id = params[:project_id].to_i
    @project = Project.find(params[:project_id])
    @tasks = Task.where(project_id: params[:project_id])

    json = JSON.parse(params[:post_json])
    task_list = json['task_list']
    connection_list = json['connection_list']

    task_id_list = []

    # タスクの作成・更新
    task_list.each_with_index do |task_and_shape, i|

      shape = json_to_shape_hash(task_and_shape['shape'])

      uuid = task_and_shape['task']['id'].is_a?(String) ? task_and_shape['task']['id'] : nil
      if !uuid.nil?
        logger.debug('create Task. uuid: ' + uuid)
        shape_data = Shape.create!(**shape)
        logger.debug('create Shape. id: ' + shape_data.id.to_s)
        shape_id = shape_data.id
        task = json_to_task_hash(task_and_shape['task'], shape_id)
        logger.debug(task)
        task_data = Task.create!(**task)
        logger.debug('create Task. id: ' + task_data.id.to_s)

        # connection_list の task_id(UUID) を新しく生成した task_id(int) で更新
        connection_list.map! do |connection|
          update_old_task_id(connection, uuid, task_data.id)
        end
        task_id_list.append(task_data.id)
      else
        task_data = Task.find(task_and_shape['task']['id'])
        shape_data = Shape.find(task_data.shape_id)

        task = json_to_task_hash(task_and_shape['task'], task_data.shape_id)

        task_data.update(**task)
        shape_data.update(**shape)
        task_id_list.append(task_data.id)
      end

      # タグの作成・更新
      tags = task_and_shape['task']['tags']
      tags&.each do |tag|
        tag_id = Tag.find_or_create_by(tag_category: tag).id
        TagTable.find_or_create_by(tag_id: tag_id, task_id: task_data.id, project_id: @project_id)
      end

      # 使用していない Tag を削除
      TagTable.where(task_id: task_data.id, project_id: @project_id).each do |tag_table|
        if !tags.include?(Tag.find(tag_table.tag_id).tag_category)
          tag_table.destroy
        end
      end
    end
    
    # 使用していない Task を削除
    destroy_unused_tasks(task_id_list)

    # connection_list から TaskRelation を作成
    connection_list.each{|connection| create_task_relation(connection)}

    destroy_unused_task_relations(connection_list)

    redirect_to '/projects/' + @project_id.to_s
  end

  private

  # JSON 内で使用されていない Task を DB から削除
  # @param [Array] json_id_list json 内に存在する task_id のリスト
  # @return [nil]
  def destroy_unused_tasks(json_id_list)
    Task.where(project_id: @project_id).each do |task|
      if !json_id_list.include?(task.id)
        logger.debug('[log] task deleted. task_id= ' + task.id.to_s)
        # 削除するtaskに紐づくdbのデータを削除
        prj_relations = TaskRelation.where(project_id: @project_id)
        prj_relations.where(start_task_id: task.id).destroy_all
        prj_relations.where(end_task_id: task.id).destroy_all
        TagTable.where(task_id: task.id).destroy_all
        task.destroy
      end
    end
  end

  # JSON 内で使用されていない TaskRelation を DB から削除
  # @param [Array] json_connection_list json 内に存在する connection のリスト
  # @return [nil]
  def destroy_unused_task_relations(json_connection_list)
    TaskRelation.where(project_id: @project_id).each do |task_relation|
      task_not_used = json_connection_list.find { |connection|
        connection['start_task_id'] == task_relation.start_task_id &&
        connection['end_task_id'] == task_relation.end_task_id
      }.nil?
      if task_not_used
        logger.debug('[log] task_relation deleted. task_relation_id= ' + task_relation.id.to_s)
        task_relation.destroy
      end
    end
  end

  def json_to_shape_hash(shape)
    key_list = [:x, :y, :width, :height, :shape_type]
    shape['shape_type'] = 'Task'

    shape_hash = {}
    key_list.each do |key|
      shape_hash[key] = shape[key.to_s]
    end
    shape_hash
  end

  def json_to_task_hash(task, shape_id)
    key_list = [:title, :user_id, :description, :status_id, :priority_id,
                :start_date, :deadline, :work_output, :project_id, :shape_id]

    task['start_date'] = Time.zone.iso8601(task['start_date']).to_s
    task['deadline'] = Time.zone.iso8601(task['deadline']).to_s
    task['user_id'] = User.find_by(user_name: task['manager'])&.id
    task['status_id'] = Status.find_by(name: task['status']).id
    task['priority_id'] = Priority.find_by(name: task['priority'])&.id
    task['priority_id'] ||= Priority.find_by(name: '低').id
    task['project_id'] = @project_id
    task['shape_id'] = shape_id

    task_hash = {}
    key_list.each do |key|
      task_hash[key] = task[key.to_s]
    end
    task_hash
  end

  def update_old_task_id(connection, old_task_id, new_task_id)
    if connection['start_task_id'] == old_task_id
      connection['start_task_id'] = new_task_id
    end
    if connection['end_task_id'] == old_task_id
      connection['end_task_id'] = new_task_id
    end
    connection
  end

  def create_task_relation(connection)
    TaskRelation.find_or_create_by(
      start_task_id: connection['start_task_id'],
      end_task_id: connection['end_task_id'],
      project_id: @project_id
    )
  end
end
