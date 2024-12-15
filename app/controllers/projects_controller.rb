class ProjectsController < ApplicationController
    before_action :logged_in_user, only: [:index, :new, :create, :edit, :update, :destroy, :show]
    before_action :set_project, only: [:show, :edit, :update, :destroy]

    def index
        @projects = Project.all
        @user = current_user
    end

    def new
        @project = Project.new
        @users = User.all
        @user = current_user
    end

    def create
        @project = Project.new(project_params)

        if @project.save
            redirect_to projects_path
        else
            render :new
        end
    end

    def edit
        @project = Project.find(params[:id])
        @user = current_user
        # 現在のユーザーがマネージャーでなければリダイレクト
        unless @project.manager_id == @user.id
          redirect_to projects_path, alert: '編集権限がありません。'
          return
        end
        @deliverables = @project.deliverables
        @users = User.where.not(id: @user.id) # 現在のユーザーを除く
        @project_members = @project.users
      end
      
      def update
        @project = Project.find(params[:id])
        # 現在のユーザーがマネージャーでなければリダイレクト
        unless @project.manager_id == current_user.id
          redirect_to projects_path, alert: '更新権限がありません。'
          return
        end
        if @project.update(project_params)
          redirect_to project_path(@project), notice: 'プロジェクトが正常に更新されました。'
        else
          render 'edit'
        end
      end

    def destroy
        @project = Project.find(params[:id])
        @project.destroy
        redirect_to projects_path
    end

    def show
        @id = params[:id].to_i
        @project = Project.find(@id)
        @manager = User.find_by(id: @project.manager_id)
        @tasks = Task.where(project_id: @id)
        @user = current_user
        @users = User.all.map{|user| user.user_name}
        @tags = Tag.all.map{|tag| tag.tag_category}
        data = {}
        @project_members = @project.users

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
            tags = TagTable.where(task_id: task.id).where(project_id: @id)
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
        TaskRelation.where(project_id: @id).each do |task_relation|
            connection_data = {}
            connection_data['start_task_id'] = task_relation.start_task_id.to_i
            connection_data['end_task_id'] = task_relation.end_task_id.to_i
            data['connection_list'] ||= []
            data['connection_list'].append(connection_data)
        end
        data['connection_list'] ||= []

        # tag_list の作成
        data['tag_list'] = @tags

        @json = JSON.dump(data)
        
        puts @json
    end

    private

    def project_params
        params.require(:project).permit(
          :title,
          :content,
          :manager_id,
          :deadline,
          :customer_requirements,
          :development_input,
          :development_environment,
          :quality_definition,
          user_ids: [],
          deliverables_attributes: [:id, :name, :_destroy]
        )
    end

    def set_project
        @project = Project.find(params[:id])
    end

end
